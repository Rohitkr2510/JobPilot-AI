import React, { useState, useEffect } from 'react';
import { ROHIT_CANDIDATE_PROFILE, SEED_JOBS, DEFAULT_SCORING_WEIGHTS } from './data/masterProfile';
import { JobOpportunity, JobStatus, MasterCandidateProfile, ScoringWeights, UploadedResumeRecord } from './types';
import { isDuplicateJob, deduplicateJobList } from './utils/jobDeduplication';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { JobsExplorerView } from './components/JobsExplorerView';
import { ApplicationWorkspaceView } from './components/ApplicationWorkspaceView';
import { TrackerView } from './components/TrackerView';
import { MasterProfileView } from './components/MasterProfileView';
import { AnalyticsView } from './components/AnalyticsView';
import { IngestJobModal } from './components/IngestJobModal';
import { GmailSyncModal } from './components/GmailSyncModal';
import { ResumeUploadModal } from './components/ResumeUploadModal';
import { SqliteDailyModal } from './components/SqliteDailyModal';
import { BackupBinModal } from './components/BackupBinModal';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function App() {
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [masterProfile, setMasterProfile] = useState<MasterCandidateProfile>(ROHIT_CANDIDATE_PROFILE);
  const [latestResume, setLatestResume] = useState<UploadedResumeRecord | null>(null);
  const [scoringWeights, setScoringWeights] = useState<ScoringWeights>(DEFAULT_SCORING_WEIGHTS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'workspace' | 'tracker' | 'profile' | 'analytics'>('dashboard');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  
  // Modals for Gmail, Resume Upload, SQLite Daily Routine, and 7-Day Backup Bin
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isSqliteModalOpen, setIsSqliteModalOpen] = useState(false);
  const [isBackupBinOpen, setIsBackupBinOpen] = useState(false);
  const [isGmailLinked, setIsGmailLinked] = useState<boolean>(() => 
    Boolean(localStorage.getItem('jobpilot_gmail_token'))
  );

  // Async state indicators
  const [isAnalyzingId, setIsAnalyzingId] = useState<string | null>(null);
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [isGeneratingQA, setIsGeneratingQA] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false);

  // Toast system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Helper: Persist job updates to local SQLite database
  const persistJobToSqlite = (job: JobOpportunity) => {
    fetch(`/api/jobs/${job.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job }),
    }).catch(err => {
      console.warn('SQLite background sync note:', err.message);
    });
  };

  const fetchLatestResume = () => {
    fetch('/api/resume/latest')
      .then(res => res.json())
      .then(data => {
        if (data.resume) {
          setLatestResume(data.resume);
        }
      })
      .catch(() => {});
  };

  // Initial Load: Sync from SQLite store
  useEffect(() => {
    // 1. Fetch persistent Candidate Profile from SQLite
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data.profile && data.profile.name) {
          setMasterProfile(data.profile);
        }
      })
      .catch(() => {});

    // 2. Fetch persistent Jobs from SQLite
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        if (data.jobs && Array.isArray(data.jobs)) {
          setJobs(data.jobs);
          if (data.jobs.length > 0) {
            setSelectedJobId(data.jobs[0].id);
          }
        }
      })
      .catch(() => {});

    // 3. Fetch latest uploaded resume from SQLite
    fetchLatestResume();
  }, []);

  const selectedJob = jobs.find(j => j.id === selectedJobId) || (jobs.length > 0 ? jobs[0] : null);

  const handleSelectJob = (job: JobOpportunity) => {
    setSelectedJobId(job.id);
    setActiveTab('workspace');
  };

  const handleUpdateJobStatus = (jobId: string, newStatus: JobStatus) => {
    setJobs(prevJobs =>
      prevJobs.map(job => {
        if (job.id === jobId) {
          const updated = { ...job, status: newStatus };
          if (newStatus === 'APPLIED' && !job.appliedDate) {
            updated.appliedDate = new Date().toISOString().split('T')[0];
          }
          persistJobToSqlite(updated);
          return updated;
        }
        return job;
      })
    );
    showToast(`Status updated to ${newStatus}`, 'info');
  };

  // Delete job from main table and move to 7-day backup bin
  const handleDeleteJob = async (job: JobOpportunity) => {
    try {
      let res = await fetch(`/api/jobs/${job.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        res = await fetch(`/api/jobs/${job.id}/delete`, {
          method: 'POST',
        });
      }
      if (!res.ok) {
        throw new Error('Failed to delete job');
      }
      // Remove from active state
      setJobs(prev => prev.filter(j => j.id !== job.id));

      // If deleted job was selected in workspace, switch to first remaining or jobs tab
      if (selectedJobId === job.id) {
        const remaining = jobs.filter(j => j.id !== job.id);
        if (remaining.length > 0) {
          setSelectedJobId(remaining[0].id);
        } else {
          setActiveTab('jobs');
        }
      }

      showToast(`"${job.company} - ${job.title}" moved to 7-day Backup Bin`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Error moving job to backup', 'error');
    }
  };

  // Callback when a job is restored from backup bin
  const handleJobRestored = (restoredJob: JobOpportunity) => {
    setJobs(prev => {
      if (prev.some(j => j.id === restoredJob.id)) {
        return prev.map(j => (j.id === restoredJob.id ? restoredJob : j));
      }
      return [restoredJob, ...prev];
    });
    setSelectedJobId(restoredJob.id);
    showToast(`Restored "${restoredJob.company} - ${restoredJob.title}" to active jobs!`, 'success');
  };

  const [isRescoringAll, setIsRescoringAll] = useState(false);

  // 1. Re-analyze a single job with Gemini / Hybrid Analyzer
  const handleReanalyzeJob = async (job: JobOpportunity) => {
    setIsAnalyzingId(job.id);
    try {
      const res = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          title: job.title,
          company: job.company,
          jobDescription: job.description,
          candidateProfile: masterProfile,
          masterProfile: masterProfile,
        })
      });

      if (!res.ok) throw new Error('Analysis request failed');
      const data = await res.json();

      const updatedJob = {
        ...job,
        matchAnalysis: data.analysis,
        status: (job.status === 'APPLIED' || job.status === 'INTERVIEW' || job.status === 'OFFER' || job.status === 'SCREENING' || job.status === 'REJECTED')
          ? job.status
          : ((data.analysis.overallScore >= 80 ? 'RECOMMENDED' : 'MATCHED') as JobStatus)
      };
      persistJobToSqlite(updatedJob);

      setJobs(prev =>
        prev.map(j => (j.id === job.id ? updatedJob : j))
      );
      showToast(`Re-analysis complete for ${job.company}: ${data.analysis.overallScore}% score (${data.analysis.recommendation})`);
    } catch (err: any) {
      showToast(err.message || 'Error re-analyzing job', 'error');
    } finally {
      setIsAnalyzingId(null);
    }
  };

  // Batch re-analyze all opportunities against master profile
  const handleRescoreAllJobs = async () => {
    setIsRescoringAll(true);
    try {
      const res = await fetch('/api/jobs/rescore-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterProfile
        })
      });

      if (!res.ok) throw new Error('Failed to re-score jobs');
      const data = await res.json();

      if (data.jobs) {
        setJobs(data.jobs);
        showToast(`Re-analyzed ${data.jobs.length} jobs with 7-factor matching engine!`);
      }
    } catch (err: any) {
      showToast(err.message || 'Error running batch analysis', 'error');
    } finally {
      setIsRescoringAll(false);
    }
  };

  // 2. Generate / Optimize Resume
  const handleGenerateResume = async (job: JobOpportunity) => {
    setIsGeneratingResume(true);
    try {
      const res = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          title: job.title,
          company: job.company,
          jobDescription: job.description,
          candidateProfile: masterProfile,
          masterProfile
        })
      });

      if (!res.ok) throw new Error('Resume optimization failed');
      const data = await res.json();
      const resumeVersion = data.resumeVersion || data.resume;

      if (!resumeVersion) throw new Error('Failed to generate resume');

      const updatedJob = { ...job, resumeVersion, status: 'RESUME_READY' as JobStatus };
      persistJobToSqlite(updatedJob);

      setJobs(prev =>
        prev.map(j => (j.id === job.id ? updatedJob : j))
      );
      showToast(`One-Page ATS resume generated for ${job.company}!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to optimize resume', 'error');
    } finally {
      setIsGeneratingResume(false);
    }
  };

  // 3. Generate Application Q&A
  const handleGenerateQA = async (job: JobOpportunity, customQuestions?: string[]) => {
    setIsGeneratingQA(true);
    try {
      const res = await fetch('/api/generate-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: job.title,
          company: job.company,
          jobDescription: job.description,
          candidateProfile: masterProfile,
          masterProfile,
          customQuestions: customQuestions || [],
          questions: customQuestions || []
        })
      });

      if (!res.ok) throw new Error('Failed to generate application answers');
      const data = await res.json();
      const answers = data.answers || [];

      let updatedJobRef: JobOpportunity | null = null;
      setJobs(prev =>
        prev.map(j => {
          if (j.id === job.id) {
            const existing = j.applicationAnswers || [];
            const updated = [...existing];
            for (const newQA of answers) {
              const existingIdx = updated.findIndex(q => q.question.toLowerCase() === newQA.question.toLowerCase());
              if (existingIdx >= 0) {
                updated[existingIdx] = newQA;
              } else {
                updated.push(newQA);
              }
            }
            const updatedJob = { ...j, applicationAnswers: updated };
            updatedJobRef = updatedJob;
            return updatedJob;
          }
          return j;
        })
      );

      if (updatedJobRef) {
        persistJobToSqlite(updatedJobRef);
      }

      showToast(`Generated tailored application responses!`);
    } catch (err: any) {
      showToast(err.message || 'Error generating Q&A', 'error');
    } finally {
      setIsGeneratingQA(false);
    }
  };

  // 4. Generate Cold Email
  const handleGenerateColdEmail = async (
    job: JobOpportunity,
    recipientName = 'Talent Acquisition Lead',
    recipientRole = 'Technical Recruiter'
  ) => {
    setIsGeneratingEmail(true);
    try {
      const res = await fetch('/api/generate-cold-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: job.title,
          company: job.company,
          jobDescription: job.description,
          candidateProfile: masterProfile,
          masterProfile,
          recipientName,
          recipientRole
        })
      });

      if (!res.ok) throw new Error('Failed to generate cold email');
      const data = await res.json();
      const coldEmail = data.coldEmail || data.email;

      const updatedJob = { ...job, coldEmail };
      persistJobToSqlite(updatedJob);

      setJobs(prev =>
        prev.map(j => (j.id === job.id ? updatedJob : j))
      );
      showToast(`Tailored outreach email generated for ${job.company}`);
    } catch (err: any) {
      showToast(err.message || 'Error generating email', 'error');
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  // 5. Generate Interview Prep Dossier
  const handleGenerateInterviewPrep = async (job: JobOpportunity) => {
    setIsGeneratingPrep(true);
    try {
      const res = await fetch('/api/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: job.title,
          company: job.company,
          jobDescription: job.description,
          candidateProfile: masterProfile,
          masterProfile
        })
      });

      if (!res.ok) throw new Error('Failed to generate interview prep plan');
      const data = await res.json();
      const interviewPrep = data.interviewPrep || data.plan;

      const updatedJob = { ...job, interviewPrep };
      persistJobToSqlite(updatedJob);

      setJobs(prev =>
        prev.map(j => (j.id === job.id ? updatedJob : j))
      );
      showToast(`Interview preparation coach plan ready for ${job.company}`);
    } catch (err: any) {
      showToast(err.message || 'Error generating interview dossier', 'error');
    } finally {
      setIsGeneratingPrep(false);
    }
  };

  // 6. On Ingest New Job
  const handleJobIngested = (newJob: JobOpportunity) => {
    let existingFound: JobOpportunity | null = null;

    setJobs(prev => {
      const existing = prev.find(j => isDuplicateJob(j, newJob));
      if (existing) {
        existingFound = existing;
        return prev.map(j => (j.id === existing.id ? { ...existing, ...newJob, id: existing.id } : j));
      }
      return [newJob, ...prev];
    });

    if (existingFound) {
      const found = existingFound as JobOpportunity;
      setSelectedJobId(found.id);
      setActiveTab('workspace');
      showToast(`Selected existing opportunity: ${found.company} - ${found.title}`, 'info');
    } else {
      persistJobToSqlite(newJob);
      setSelectedJobId(newJob.id);
      setActiveTab('workspace');
      showToast(`Job alert ingested: ${newJob.title} @ ${newJob.company} (${newJob.matchAnalysis?.overallScore || 85}% match)!`, 'success');
    }
  };

  // 7. On Jobs Imported from Gmail
  const handleJobsImportedFromGmail = (importedJobs: JobOpportunity[]) => {
    setJobs(prev => {
      const combined = [...importedJobs, ...prev];
      return deduplicateJobList(combined);
    });

    if (importedJobs.length > 0) {
      setSelectedJobId(importedJobs[0].id);
      setIsGmailLinked(true);
    }
  };

  // 8. On Resume Parsed & Updated
  const handleProfileUpdated = (newProfile: MasterCandidateProfile, updatedJobs?: JobOpportunity[]) => {
    setMasterProfile(newProfile);
    fetchLatestResume();
    if (updatedJobs && updatedJobs.length > 0) {
      setJobs(updatedJobs);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top App Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTabChange={setActiveTab}
        onOpenIngestModal={() => setIsIngestModalOpen(true)}
        onOpenGmailSync={() => setIsGmailModalOpen(true)}
        onOpenResumeUpload={() => setIsResumeModalOpen(true)}
        onOpenSqliteDaily={() => setIsSqliteModalOpen(true)}
        onOpenBackupBin={() => setIsBackupBinOpen(true)}
        jobsCount={jobs.length}
        strongMatchesCount={jobs.filter(j => (j.matchAnalysis?.overallScore || 0) >= 90).length}
        followUpsCount={jobs.filter(j => j.status === 'APPLIED' && j.appliedDate).length}
        isGmailLinked={isGmailLinked}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            jobs={jobs}
            masterProfile={masterProfile}
            onSelectJob={handleSelectJob}
            onOpenIngestModal={() => setIsIngestModalOpen(true)}
            onOpenGmailSync={() => setIsGmailModalOpen(true)}
            onOpenResumeUpload={() => setIsResumeModalOpen(true)}
            onOpenSqliteDaily={() => setIsSqliteModalOpen(true)}
            onOpenBackupBin={() => setIsBackupBinOpen(true)}
            onNavigateToJobs={() => setActiveTab('jobs')}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'jobs' && (
          <JobsExplorerView
            jobs={jobs}
            onSelectJob={handleSelectJob}
            onUpdateJobStatus={handleUpdateJobStatus}
            onReanalyzeJob={handleReanalyzeJob}
            onRescoreAllJobs={handleRescoreAllJobs}
            onDeleteJob={handleDeleteJob}
            onOpenBackupBin={() => setIsBackupBinOpen(true)}
            isAnalyzingId={isAnalyzingId}
            isRescoringAll={isRescoringAll}
          />
        )}

        {activeTab === 'workspace' && (
          <ApplicationWorkspaceView
            job={selectedJob}
            jobs={jobs}
            onSelectJob={handleSelectJob}
            masterProfile={masterProfile}
            latestResume={latestResume}
            onBackToJobs={() => setActiveTab('jobs')}
            onOpenResumeUpload={() => setIsResumeModalOpen(true)}
            onOpenIngestModal={() => setIsIngestModalOpen(true)}
            onOpenGmailSync={() => setIsGmailModalOpen(true)}
            onDeleteJob={handleDeleteJob}
            onGenerateResume={handleGenerateResume}
            onGenerateQA={handleGenerateQA}
            onGenerateColdEmail={handleGenerateColdEmail}
            onGenerateInterviewPrep={handleGenerateInterviewPrep}
            onUpdateJobStatus={handleUpdateJobStatus}
            isGeneratingResume={isGeneratingResume}
            isGeneratingQA={isGeneratingQA}
            isGeneratingEmail={isGeneratingEmail}
            isGeneratingPrep={isGeneratingPrep}
          />
        )}

        {activeTab === 'tracker' && (
          <TrackerView
            jobs={jobs}
            onSelectJob={handleSelectJob}
            onUpdateJobStatus={handleUpdateJobStatus}
            onDeleteJob={handleDeleteJob}
            onOpenBackupBin={() => setIsBackupBinOpen(true)}
          />
        )}

        {activeTab === 'profile' && (
          <MasterProfileView
            profile={masterProfile}
            weights={scoringWeights}
            onUpdateWeights={setScoringWeights}
            onProfileUpdated={handleProfileUpdated}
            onOpenResumeUpload={() => setIsResumeModalOpen(true)}
            onToast={showToast}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            jobs={jobs}
          />
        )}
      </main>

      {/* Ingest Job Modal */}
      <IngestJobModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onJobIngested={handleJobIngested}
      />

      {/* Gmail Job Alerts Sync Modal */}
      <GmailSyncModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        onJobsImported={handleJobsImportedFromGmail}
        onToast={showToast}
      />

      {/* Resume Upload & Parse Modal */}
      <ResumeUploadModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        currentProfile={masterProfile}
        onProfileUpdated={handleProfileUpdated}
        onToast={showToast}
      />

      {/* SQLite Local Daily Assistant Modal */}
      <SqliteDailyModal
        isOpen={isSqliteModalOpen}
        onClose={() => setIsSqliteModalOpen(false)}
        jobs={jobs}
        onOpenGmailSync={() => {
          setIsSqliteModalOpen(false);
          setIsGmailModalOpen(true);
        }}
        onOpenResumeUpload={() => {
          setIsSqliteModalOpen(false);
          setIsResumeModalOpen(true);
        }}
        onOpenBackupBin={() => {
          setIsSqliteModalOpen(false);
          setIsBackupBinOpen(true);
        }}
      />

      {/* 7-Day SQLite Backup Bin & Restore Modal */}
      <BackupBinModal
        isOpen={isBackupBinOpen}
        onClose={() => setIsBackupBinOpen(false)}
        onJobRestored={handleJobRestored}
        onToast={showToast}
      />

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-slate-900 border-emerald-500/40 text-white'
              : toast.type === 'error'
              ? 'bg-rose-950 border-rose-500/40 text-rose-200'
              : 'bg-slate-900 border-blue-500/40 text-blue-200'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
        JobPilot AI • DevOps Job & Application Assistant • Candidate: {masterProfile.name} • Local SQLite: data/jobpilot.db
      </footer>
    </div>
  );
}
