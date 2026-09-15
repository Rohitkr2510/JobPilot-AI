import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { ROHIT_CANDIDATE_PROFILE, SEED_JOBS, DEFAULT_RAW_RESUME_TEXT } from '../src/data/masterProfile';
import { JobOpportunity, MasterCandidateProfile, UploadedResumeRecord } from '../src/types';
import { cleanCompanyName, cleanJobTitle, isDuplicateJob } from '../src/utils/jobDeduplication';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch (e) {
    // Ignore directory create errors if already exists
  }
}

const DB_FILE_PATH = path.join(DB_DIR, 'jobpilot.db');
export const dbClient = createClient({
  url: `file:${DB_FILE_PATH}`,
});

/**
 * Initialize SQLite database schema and seed default data if empty
 */
export async function initDatabase(): Promise<void> {
  // 1. Candidate Profile Table
  await dbClient.execute(`
    CREATE TABLE IF NOT EXISTS candidate_profile (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2. Jobs Table
  await dbClient.execute(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      title TEXT NOT NULL,
      location TEXT,
      remote_type TEXT,
      status TEXT NOT NULL,
      overall_score INTEGER,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 3. Gmail Sync History Table
  await dbClient.execute(`
    CREATE TABLE IF NOT EXISTS gmail_sync_history (
      id TEXT PRIMARY KEY,
      sync_date TEXT NOT NULL,
      emails_scanned INTEGER NOT NULL,
      jobs_imported INTEGER NOT NULL,
      query TEXT,
      status TEXT NOT NULL,
      details TEXT
    );
  `);

  // 4. Jobs Backup Table (moved from main jobs table on delete, auto-purged after 7 days)
  await dbClient.execute(`
    CREATE TABLE IF NOT EXISTS jobs_backup (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      title TEXT NOT NULL,
      location TEXT,
      remote_type TEXT,
      status TEXT NOT NULL,
      overall_score INTEGER,
      data TEXT NOT NULL,
      deleted_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      original_created_at TEXT
    );
  `);

  // 5. App Settings Table
  await dbClient.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // 6. Uploaded Resumes Table
  await dbClient.execute(`
    CREATE TABLE IF NOT EXISTS uploaded_resumes (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      file_type TEXT,
      raw_text TEXT NOT NULL,
      uploaded_at TEXT NOT NULL,
      file_size_bytes INTEGER,
      word_count INTEGER,
      char_count INTEGER,
      parsed_profile_snapshot TEXT,
      is_active INTEGER DEFAULT 1
    );
  `);

  // Run automatic cleanup of expired backups (older than 7 days)
  await cleanupExpiredBackups();

  // Check if profile exists; if not or if placeholder email exists, update with Rohit's latest master profile
  const profileRes = await dbClient.execute({
    sql: 'SELECT data FROM candidate_profile WHERE id = ?',
    args: ['active'],
  });

  if (profileRes.rows.length === 0) {
    await dbClient.execute({
      sql: 'INSERT INTO candidate_profile (id, data, updated_at) VALUES (?, ?, ?)',
      args: ['active', JSON.stringify(ROHIT_CANDIDATE_PROFILE), new Date().toISOString()],
    });
    console.log('[SQLite] Seeded candidate profile for Rohit Kumar Mahato.');
  } else {
    // If existing profile data has old email/phone or lacks latest links, merge them
    try {
      const existing = JSON.parse(profileRes.rows[0].data as string);
      const updatedProfile = {
        ...existing,
        email: ROHIT_CANDIDATE_PROFILE.email,
        phone: ROHIT_CANDIDATE_PROFILE.phone,
        linkedinUrl: ROHIT_CANDIDATE_PROFILE.linkedinUrl,
        githubUrl: ROHIT_CANDIDATE_PROFILE.githubUrl,
        leetcodeUrl: ROHIT_CANDIDATE_PROFILE.leetcodeUrl,
        credlyUrl: ROHIT_CANDIDATE_PROFILE.credlyUrl,
        projects: ROHIT_CANDIDATE_PROFILE.projects,
      };
      await dbClient.execute({
        sql: 'UPDATE candidate_profile SET data = ?, updated_at = ? WHERE id = ?',
        args: [JSON.stringify(updatedProfile), new Date().toISOString(), 'active'],
      });
      console.log('[SQLite] Synced candidate profile with latest verified credentials.');
    } catch (e) {
      // Ignore JSON parse error
    }
  }

  // Ensure latest active uploaded resume exists with updated contact and project details
  const now = new Date().toISOString();
  const rawText = DEFAULT_RAW_RESUME_TEXT;
  const words = rawText.split(/\s+/).filter(Boolean).length;

  const resumeRes = await dbClient.execute('SELECT id FROM uploaded_resumes WHERE is_active = 1 LIMIT 1');
  if (resumeRes.rows.length === 0) {
    await dbClient.execute({
      sql: `
        INSERT INTO uploaded_resumes (
          id, file_name, file_type, raw_text, uploaded_at, file_size_bytes, word_count, char_count, parsed_profile_snapshot, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `,
      args: [
        `resume-${Date.now()}`,
        'Rohit_Kumar_Mahato_DevOps_Resume.txt',
        'text/plain',
        rawText,
        now,
        Buffer.byteLength(rawText, 'utf8'),
        words,
        rawText.length,
        JSON.stringify(ROHIT_CANDIDATE_PROFILE),
      ],
    });
    console.log('[SQLite] Seeded initial uploaded resume document in SQLite.');
  } else {
    // Update existing active resume text to reflect latest verified contact & links
    const activeResumeId = resumeRes.rows[0].id as string;
    await dbClient.execute({
      sql: `
        UPDATE uploaded_resumes 
        SET raw_text = ?, word_count = ?, char_count = ?, file_name = ?, parsed_profile_snapshot = ?, uploaded_at = ?
        WHERE id = ?
      `,
      args: [
        rawText,
        words,
        rawText.length,
        'Rohit_Kumar_Mahato_DevOps_Resume.txt',
        JSON.stringify(ROHIT_CANDIDATE_PROFILE),
        now,
        activeResumeId,
      ],
    });
    console.log('[SQLite] Updated active uploaded resume in SQLite.');
  }

  // Auto-deduplicate database on startup to clean duplicate entries and normalize legacy records
  await deduplicateDatabaseJobs();

  // Clean start: No dummy jobs are seeded automatically.
  console.log(`[SQLite] Database initialized at: ${DB_FILE_PATH}`);
}

/**
 * Get the latest active uploaded resume from SQLite
 */
export async function getLatestUploadedResume(): Promise<UploadedResumeRecord | null> {
  const res = await dbClient.execute(
    'SELECT * FROM uploaded_resumes WHERE is_active = 1 ORDER BY uploaded_at DESC LIMIT 1'
  );

  if (res.rows.length === 0) {
    const anyRes = await dbClient.execute(
      'SELECT * FROM uploaded_resumes ORDER BY uploaded_at DESC LIMIT 1'
    );
    if (anyRes.rows.length === 0) return null;
    const row = anyRes.rows[0];
    return formatResumeRow(row);
  }

  return formatResumeRow(res.rows[0]);
}

/**
 * Get all uploaded resumes history from SQLite
 */
export async function getAllUploadedResumes(): Promise<UploadedResumeRecord[]> {
  const res = await dbClient.execute(
    'SELECT * FROM uploaded_resumes ORDER BY uploaded_at DESC'
  );

  return res.rows.map(row => formatResumeRow(row));
}

function formatResumeRow(row: any): UploadedResumeRecord {
  let parsedSnapshot: MasterCandidateProfile | undefined = undefined;
  if (row.parsed_profile_snapshot) {
    try {
      parsedSnapshot = JSON.parse(row.parsed_profile_snapshot as string);
    } catch {}
  }

  return {
    id: String(row.id),
    fileName: String(row.file_name || 'Uploaded_Resume.txt'),
    fileType: row.file_type ? String(row.file_type) : 'text/plain',
    rawText: String(row.raw_text || ''),
    uploadedAt: String(row.uploaded_at || new Date().toISOString()),
    fileSizeBytes: typeof row.file_size_bytes === 'number' ? row.file_size_bytes : (row.raw_text ? String(row.raw_text).length : 0),
    wordCount: typeof row.word_count === 'number' ? row.word_count : (row.raw_text ? String(row.raw_text).split(/\s+/).filter(Boolean).length : 0),
    charCount: typeof row.char_count === 'number' ? row.char_count : (row.raw_text ? String(row.raw_text).length : 0),
    parsedProfileSnapshot: parsedSnapshot,
    isActive: row.is_active === 1,
  };
}

/**
 * Save a new uploaded resume record to SQLite (marks it as active)
 */
export async function saveUploadedResume(
  record: {
    fileName: string;
    rawText: string;
    fileType?: string;
    fileSizeBytes?: number;
  },
  parsedSnapshot?: MasterCandidateProfile
): Promise<UploadedResumeRecord> {
  const id = `resume-${Date.now()}`;
  const now = new Date().toISOString();
  const words = record.rawText.split(/\s+/).filter(Boolean).length;
  const chars = record.rawText.length;
  const size = record.fileSizeBytes || Buffer.byteLength(record.rawText, 'utf8');

  // Deactivate previous active flags
  await dbClient.execute('UPDATE uploaded_resumes SET is_active = 0 WHERE is_active = 1');

  // Insert new active resume
  await dbClient.execute({
    sql: `
      INSERT INTO uploaded_resumes (
        id, file_name, file_type, raw_text, uploaded_at, file_size_bytes, word_count, char_count, parsed_profile_snapshot, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `,
    args: [
      id,
      record.fileName || 'Uploaded_Resume.txt',
      record.fileType || 'text/plain',
      record.rawText,
      now,
      size,
      words,
      chars,
      parsedSnapshot ? JSON.stringify(parsedSnapshot) : null,
    ],
  });

  return {
    id,
    fileName: record.fileName || 'Uploaded_Resume.txt',
    fileType: record.fileType || 'text/plain',
    rawText: record.rawText,
    uploadedAt: now,
    fileSizeBytes: size,
    wordCount: words,
    charCount: chars,
    parsedProfileSnapshot: parsedSnapshot,
    isActive: true,
  };
}


/**
 * Get active candidate profile
 */
export async function getActiveProfile(): Promise<MasterCandidateProfile> {
  const res = await dbClient.execute({
    sql: 'SELECT data FROM candidate_profile WHERE id = ?',
    args: ['active'],
  });

  if (res.rows.length > 0 && res.rows[0].data) {
    try {
      return JSON.parse(res.rows[0].data as string);
    } catch {
      return ROHIT_CANDIDATE_PROFILE;
    }
  }

  return ROHIT_CANDIDATE_PROFILE;
}

/**
 * Save / update active candidate profile
 */
export async function saveActiveProfile(profile: MasterCandidateProfile): Promise<void> {
  await dbClient.execute({
    sql: 'INSERT OR REPLACE INTO candidate_profile (id, data, updated_at) VALUES (?, ?, ?)',
    args: ['active', JSON.stringify(profile), new Date().toISOString()],
  });
}

/**
 * Get all jobs from SQLite
 */
export async function getAllJobs(): Promise<JobOpportunity[]> {
  const res = await dbClient.execute('SELECT data FROM jobs ORDER BY updated_at DESC');
  const jobs: JobOpportunity[] = [];

  for (const row of res.rows) {
    if (row.data) {
      try {
        jobs.push(JSON.parse(row.data as string));
      } catch (err) {
        console.error('[SQLite] Failed to parse job row JSON:', err);
      }
    }
  }

  return jobs;
}

/**
 * Get job by ID
 */
export async function getJobById(id: string): Promise<JobOpportunity | null> {
  const res = await dbClient.execute({
    sql: 'SELECT data FROM jobs WHERE id = ?',
    args: [id],
  });

  if (res.rows.length > 0 && res.rows[0].data) {
    try {
      return JSON.parse(res.rows[0].data as string);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Upsert job into SQLite
 */
export async function upsertJob(job: JobOpportunity): Promise<void> {
  const score = job.matchAnalysis?.overallScore || 0;
  const now = new Date().toISOString();
  const sanitizedCompany = cleanCompanyName(job.company || 'Unknown');
  const sanitizedTitle = cleanJobTitle(job.title || 'DevOps Engineer');

  const normalizedJob: JobOpportunity = {
    ...job,
    company: sanitizedCompany,
    title: sanitizedTitle,
  };

  await dbClient.execute({
    sql: `
      INSERT OR REPLACE INTO jobs (
        id, company, title, location, remote_type, status, overall_score, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM jobs WHERE id = ?), ?), ?)
    `,
    args: [
      normalizedJob.id,
      sanitizedCompany,
      sanitizedTitle,
      normalizedJob.location || 'Remote',
      normalizedJob.remoteType || 'Hybrid',
      normalizedJob.status || 'RECOMMENDED',
      score,
      JSON.stringify(normalizedJob),
      normalizedJob.id,
      now,
      now,
    ],
  });
}

/**
 * Scans all jobs in the SQLite database, eliminates duplicate entries,
 * merges statuses (e.g. APPLIED), sanitizes dirty company/title strings,
 * and updates SQLite so that only unique entries exist.
 */
export async function deduplicateDatabaseJobs(): Promise<{ removedCount: number; cleanedCount: number; remainingCount: number }> {
  try {
    const res = await dbClient.execute('SELECT * FROM jobs ORDER BY updated_at DESC');
    if (res.rows.length === 0) {
      return { removedCount: 0, cleanedCount: 0, remainingCount: 0 };
    }

    const allJobs: JobOpportunity[] = [];
    for (const row of res.rows) {
      if (row.data) {
        try {
          const parsed = JSON.parse(row.data as string);
          allJobs.push(parsed);
        } catch {}
      }
    }

    const uniqueJobs: JobOpportunity[] = [];
    const idsToDelete: string[] = [];
    let cleanedCount = 0;

    for (const job of allJobs) {
      const existingIndex = uniqueJobs.findIndex(u => isDuplicateJob(u, job));

      if (existingIndex === -1) {
        const cleanedComp = cleanCompanyName(job.company);
        const cleanedTitle = cleanJobTitle(job.title);
        if (cleanedComp !== job.company || cleanedTitle !== job.title) {
          cleanedCount++;
        }
        uniqueJobs.push({
          ...job,
          company: cleanedComp,
          title: cleanedTitle,
        });
      } else {
        // It's a duplicate of an existing record in our unique list
        const existing = uniqueJobs[existingIndex];
        idsToDelete.push(job.id);

        // Merge valuable data (e.g. status)
        const hasBetterStatus = (job.status === 'APPLIED' || job.status === 'INTERVIEW' || job.status === 'OFFER') && existing.status !== 'APPLIED';
        const hasDirectUrl = job.url && !job.url.includes('mail.google.com') && (!existing.url || existing.url.includes('mail.google.com'));

        uniqueJobs[existingIndex] = {
          ...existing,
          status: hasBetterStatus ? job.status : existing.status,
          appliedDate: job.appliedDate || existing.appliedDate,
          url: hasDirectUrl ? job.url : existing.url,
        };
      }
    }

    // Delete redundant duplicate rows from database
    for (const dupId of idsToDelete) {
      await dbClient.execute({
        sql: 'DELETE FROM jobs WHERE id = ?',
        args: [dupId],
      });
    }

    // Update sanitized/merged unique records
    for (const uniqueJob of uniqueJobs) {
      await upsertJob(uniqueJob);
    }

    if (idsToDelete.length > 0 || cleanedCount > 0) {
      console.log(`[SQLite Deduplicator] Merged & removed ${idsToDelete.length} duplicate jobs, sanitized ${cleanedCount} company/title entries. Remaining unique jobs: ${uniqueJobs.length}`);
    }

    return {
      removedCount: idsToDelete.length,
      cleanedCount,
      remainingCount: uniqueJobs.length,
    };
  } catch (err) {
    console.error('[SQLite Deduplicator] Warning during database deduplication:', err);
    return { removedCount: 0, cleanedCount: 0, remainingCount: 0 };
  }
}

/**
 * Delete a job from main SQLite 'jobs' table and move to 'jobs_backup' table.
 * Automatically sets deleted_at (now) and expires_at (7 days from now).
 */
export async function deleteJobWithBackup(id: string): Promise<{ backedUp: boolean; job: JobOpportunity | null }> {
  // First run cleanup on any expired items
  await cleanupExpiredBackups();

  // Find job in main table
  const res = await dbClient.execute({
    sql: 'SELECT * FROM jobs WHERE id = ?',
    args: [id],
  });

  if (res.rows.length === 0) {
    return { backedUp: false, job: null };
  }

  const row = res.rows[0];
  const now = new Date();
  const deletedAt = now.toISOString();
  // Expires after exactly 7 days (7 * 24 * 60 * 60 * 1000 ms)
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  let jobObj: JobOpportunity | null = null;
  try {
    jobObj = JSON.parse(row.data as string);
  } catch {}

  // 1. Insert into jobs_backup
  await dbClient.execute({
    sql: `
      INSERT OR REPLACE INTO jobs_backup (
        id, company, title, location, remote_type, status, overall_score, data, deleted_at, expires_at, original_created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      row.id,
      row.company,
      row.title,
      row.location || '',
      row.remote_type || 'Hybrid',
      row.status,
      row.overall_score || 0,
      row.data,
      deletedAt,
      expiresAt,
      row.created_at || deletedAt,
    ],
  });

  // 2. Remove from main jobs table
  await dbClient.execute({
    sql: 'DELETE FROM jobs WHERE id = ?',
    args: [id],
  });

  return { backedUp: true, job: jobObj };
}

/**
 * Delete a job from SQLite (direct)
 */
export async function deleteJob(id: string): Promise<void> {
  await deleteJobWithBackup(id);
}

/**
 * Restore a job from jobs_backup back into the main jobs table
 */
export async function restoreJobFromBackup(id: string): Promise<JobOpportunity | null> {
  const res = await dbClient.execute({
    sql: 'SELECT * FROM jobs_backup WHERE id = ?',
    args: [id],
  });

  if (res.rows.length === 0) {
    return null;
  }

  const row = res.rows[0];
  let jobData: JobOpportunity;
  try {
    jobData = JSON.parse(row.data as string);
  } catch {
    jobData = {
      id: String(row.id),
      company: String(row.company),
      title: String(row.title),
      location: String(row.location || 'Remote'),
      remoteType: (row.remote_type || 'Hybrid') as any,
      salaryRange: 'Market Competitive',
      url: '',
      source: 'gmail_alert',
      postedDate: new Date().toISOString().split('T')[0],
      discoveredDate: new Date().toISOString().split('T')[0],
      experienceRequired: '2-5 years',
      employmentType: 'Full-time',
      description: '',
      status: (row.status || 'RECOMMENDED') as any,
    };
  }

  // 1. Upsert back into main jobs table
  await upsertJob(jobData);

  // 2. Remove from jobs_backup
  await dbClient.execute({
    sql: 'DELETE FROM jobs_backup WHERE id = ?',
    args: [id],
  });

  return jobData;
}

/**
 * Get all backup jobs, calculating remaining days and hours until 7-day expiration
 */
export async function getBackupJobs(): Promise<Array<{
  id: string;
  company: string;
  title: string;
  location: string;
  remoteType: string;
  status: string;
  overallScore: number;
  data: JobOpportunity;
  deletedAt: string;
  expiresAt: string;
  daysRemaining: number;
  hoursRemaining: number;
}>> {
  await cleanupExpiredBackups();

  const res = await dbClient.execute('SELECT * FROM jobs_backup ORDER BY deleted_at DESC');
  const nowMs = Date.now();

  return res.rows.map(r => {
    let jobData: JobOpportunity;
    try {
      jobData = JSON.parse(r.data as string);
    } catch {
      jobData = {
        id: String(r.id),
        company: String(r.company),
        title: String(r.title),
        location: String(r.location || 'Remote'),
        remoteType: (r.remote_type || 'Hybrid') as any,
        salaryRange: 'Market Competitive',
        url: '',
        source: 'gmail_alert',
        postedDate: new Date().toISOString().split('T')[0],
        discoveredDate: new Date().toISOString().split('T')[0],
        experienceRequired: '2-5 years',
        employmentType: 'Full-time',
        description: '',
        status: (r.status || 'RECOMMENDED') as any,
      };
    }

    const expiresAtStr = String(r.expires_at);
    const expiresMs = new Date(expiresAtStr).getTime();
    const remainingMs = Math.max(0, expiresMs - nowMs);
    const daysRemaining = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
    const hoursRemaining = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)));

    return {
      id: String(r.id),
      company: String(r.company),
      title: String(r.title),
      location: String(r.location || ''),
      remoteType: String(r.remote_type || 'Hybrid'),
      status: String(r.status || 'RECOMMENDED'),
      overallScore: Number(r.overall_score || 0),
      data: jobData,
      deletedAt: String(r.deleted_at),
      expiresAt: expiresAtStr,
      daysRemaining,
      hoursRemaining,
    };
  });
}

/**
 * Permanently delete a single job from backup table (before 7 days)
 */
export async function permanentlyDeleteBackupJob(id: string): Promise<boolean> {
  const res = await dbClient.execute({
    sql: 'DELETE FROM jobs_backup WHERE id = ?',
    args: [id],
  });
  return (res.rowsAffected || 0) > 0;
}

/**
 * Permanently delete all jobs from backup table (Empty Recycle Bin)
 */
export async function emptyBackupJobs(): Promise<number> {
  const res = await dbClient.execute('DELETE FROM jobs_backup');
  return res.rowsAffected || 0;
}

/**
 * Automatic cleanup of backup records that are past their 7-day expiration timestamp
 */
export async function cleanupExpiredBackups(): Promise<number> {
  const nowIso = new Date().toISOString();
  try {
    const res = await dbClient.execute({
      sql: 'DELETE FROM jobs_backup WHERE expires_at <= ?',
      args: [nowIso],
    });
    const purged = res.rowsAffected || 0;
    if (purged > 0) {
      console.log(`[SQLite Backup] Purged ${purged} expired jobs older than 7 days.`);
    }
    return purged;
  } catch (err) {
    console.error('[SQLite Backup] Cleanup error:', err);
    return 0;
  }
}

/**
 * Log Gmail sync record in SQLite
 */
export async function logGmailSync(record: {
  id: string;
  syncDate: string;
  emailsScanned: number;
  jobsImported: number;
  query: string;
  status: string;
  details?: string;
}): Promise<void> {
  await dbClient.execute({
    sql: `
      INSERT INTO gmail_sync_history (
        id, sync_date, emails_scanned, jobs_imported, query, status, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      record.id,
      record.syncDate,
      record.emailsScanned,
      record.jobsImported,
      record.query || '',
      record.status,
      record.details || '',
    ],
  });
}

/**
 * Get Gmail sync history
 */
export async function getGmailSyncHistory(limit = 10): Promise<any[]> {
  const res = await dbClient.execute({
    sql: 'SELECT * FROM gmail_sync_history ORDER BY sync_date DESC LIMIT ?',
    args: [limit],
  });

  return res.rows.map(r => ({
    id: r.id,
    syncDate: r.sync_date,
    emailsScanned: Number(r.emails_scanned),
    jobsImported: Number(r.jobs_imported),
    query: r.query,
    status: r.status,
    details: r.details,
  }));
}

/**
 * Get SQLite database statistics
 */
export async function getDbStats(): Promise<{
  dbPath: string;
  totalJobs: number;
  backupJobsCount: number;
  appliedCount: number;
  interviewCount: number;
  recommendedCount: number;
  lastSyncDate: string | null;
  fileSizeBytes: number;
}> {
  const totalJobsRes = await dbClient.execute('SELECT COUNT(*) as count FROM jobs');
  const backupJobsRes = await dbClient.execute('SELECT COUNT(*) as count FROM jobs_backup');
  const appliedRes = await dbClient.execute("SELECT COUNT(*) as count FROM jobs WHERE status = 'APPLIED'");
  const interviewRes = await dbClient.execute("SELECT COUNT(*) as count FROM jobs WHERE status = 'INTERVIEW'");
  const recRes = await dbClient.execute("SELECT COUNT(*) as count FROM jobs WHERE status = 'RECOMMENDED'");
  const syncRes = await dbClient.execute('SELECT sync_date FROM gmail_sync_history ORDER BY sync_date DESC LIMIT 1');

  let fileSizeBytes = 0;
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      fileSizeBytes = fs.statSync(DB_FILE_PATH).size;
    }
  } catch (e) {
    // Stat error ignored
  }

  return {
    dbPath: 'data/jobpilot.db',
    totalJobs: Number(totalJobsRes.rows[0]?.count || 0),
    backupJobsCount: Number(backupJobsRes.rows[0]?.count || 0),
    appliedCount: Number(appliedRes.rows[0]?.count || 0),
    interviewCount: Number(interviewRes.rows[0]?.count || 0),
    recommendedCount: Number(recRes.rows[0]?.count || 0),
    lastSyncDate: syncRes.rows.length > 0 ? (syncRes.rows[0].sync_date as string) : null,
    fileSizeBytes,
  };
}
