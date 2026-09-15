import { JobOpportunity } from '../types';

/**
 * Strips email digest noise, company suffixes, and unwanted strings from company names.
 * Example:
 * "Clock Edge Technologies Pvt Lt. 20 more devops engineer jobs in Bengaluru" -> "Clock Edge Technologies"
 * "WebSenor InfoTech. 8 more devops engineer jobs in Remote" -> "WebSenor InfoTech"
 * "Cisco Systems India Pvt. Ltd." -> "Cisco" (for matching)
 */
export function cleanCompanyName(rawCompany: string = ''): string {
  if (!rawCompany) return 'Tech Innovators';

  let name = rawCompany.trim();

  // 1. Remove common email digest prefixes/suffixes
  name = name.replace(/^(?:Job Alert:\s*|New Job:\s*|Hiring:\s*)/i, '');
  name = name.replace(/[\.·•|:,–-]\s*\d+\s+(?:more|new|other)\s+.*$/i, '');
  name = name.replace(/\s+\d+\s+(?:more|new|other)\s+.*$/i, '');
  name = name.replace(/\s*\(?\d+\s+new\s+jobs?.*$/i, '');
  name = name.replace(/\s+(?:is\s+hiring|is\s+looking\s+for|has\s+openings|urgent\s+opening).*$/i, '');
  name = name.replace(/\s*\(hiring\s+now\)/i, '');
  name = name.replace(/\s*\(recruiting\)/i, '');
  name = name.replace(/\s*\(immediate\s+joiner\)/i, '');

  // 2. Remove location tags appended to company names (e.g., " - Bengaluru", " (Remote)")
  name = name.replace(/\s*[-–|]\s*(?:Bengaluru|Bangalore|Remote|Hybrid|Hyderabad|Pune|Mumbai|Delhi|Noida|Gurgaon|India|USA|UK|Singapore).*$/i, '');
  name = name.replace(/\s*\((?:Bengaluru|Bangalore|Remote|Hybrid|Hyderabad|Pune|Mumbai|Delhi|Noida|Gurgaon|India|USA|UK|Singapore)\)/i, '');

  // 3. Remove corporate legal entity suffixes (including truncated variants from email subjects)
  name = name.replace(/\s+(?:pvt\.?\s*ltd\.?|pvt\.?\s*lt\.?|pvt\.?|private\s+limited|ltd\.?|inc\.?|incorporated|llc|corp\.?|corporation|gmbh)\.?$/i, '');

  // 4. Remove trailing dots or commas
  name = name.replace(/[.,;:\s]+$/, '').trim();

  return name || 'Tech Innovators';
}

/**
 * Returns a simplified, normalized company string used strictly for matching/deduplication.
 */
export function getCompanyMatchKey(company: string = ''): string {
  let cleaned = cleanCompanyName(company).toLowerCase();

  // Strip corporate entity legal suffixes
  cleaned = cleaned.replace(/\b(pvt\.?\s*ltd\.?|private\s+limited|limited|ltd\.?|inc\.?|incorporated|llc|corp\.?|corporation|gmbh|co\.?)\b/gi, '');
  // Strip broad generic words that don't differentiate the core brand
  cleaned = cleaned.replace(/\b(technologies|technology|tech|infotech|solutions|services|systems|software|consulting|global|group|labs|platform|networks|digital)\b/gi, '');
  // Remove non-alphanumeric characters
  cleaned = cleaned.replace(/[^a-z0-9]/g, '');

  return cleaned.trim();
}

/**
 * Strips location/contract tags and normalizes job titles.
 * Example:
 * "DevOps Engineer - Remote / Bengaluru" -> "DevOps Engineer"
 * "Senior SRE (Hybrid)" -> "Senior SRE"
 * "DeVops" -> "DevOps Engineer"
 */
export function cleanJobTitle(rawTitle: string = ''): string {
  if (!rawTitle) return 'DevOps Engineer';

  let title = rawTitle.trim();

  // Remove location tags and brackets
  title = title.replace(/\s*[-–|/]\s*(?:Remote|Hybrid|On-site|Bengaluru|Bangalore|India|USA|Full-time|Contract|Immediate).*$/i, '');
  title = title.replace(/\s*\((?:Remote|Hybrid|On-site|Bengaluru|Bangalore|India|USA|Full-time|Contract|3\+?\s*years?|Immediate)\)/gi, '');
  title = title.replace(/\s*\[(?:Remote|Hybrid|On-site|Bengaluru|Bangalore|India|USA|Full-time|Contract)\]/gi, '');

  // Normalize single-word capitalization errors like "DeVops" -> "DevOps Engineer"
  if (/^devops$/i.test(title)) {
    title = 'DevOps Engineer';
  } else if (/^sre$/i.test(title)) {
    title = 'Site Reliability Engineer (SRE)';
  }

  return title.replace(/[.,;:\s]+$/, '').trim() || 'DevOps Engineer';
}

/**
 * Returns a normalized title key for matching.
 */
export function getTitleMatchKey(title: string = ''): string {
  let cleaned = cleanJobTitle(title).toLowerCase();

  // Normalize synonyms
  cleaned = cleaned.replace(/\bsite\s+reliability\s+engineer\b/g, 'sre');
  cleaned = cleaned.replace(/\bcloud\s+infrastructure\s+engineer\b/g, 'devops');
  cleaned = cleaned.replace(/\bcloud\s+platform\s+engineer\b/g, 'devops');
  cleaned = cleaned.replace(/\bplatform\s+engineer\b/g, 'devops');
  cleaned = cleaned.replace(/\binfrastructure\s+engineer\b/g, 'devops');
  cleaned = cleaned.replace(/\bci\/?cd\s+engineer\b/g, 'devops');

  // Strip generic seniority prefixes to detect core role collisions
  cleaned = cleaned.replace(/\b(senior|sr\.?|lead|principal|staff|associate|junior|jr\.?)\b/gi, '');
  cleaned = cleaned.replace(/[^a-z0-9]/g, '');

  return cleaned.trim();
}

/**
 * Normalizes a job URL by removing tracking query parameters and extracting canonical IDs.
 */
export function normalizeJobUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const urlStr = rawUrl.trim();
  if (!urlStr || urlStr.includes('mail.google.com')) return '';

  try {
    const parsed = new URL(urlStr);

    // Extract canonical job IDs from known platforms
    // 1. LinkedIn: /jobs/view/123456789
    const linkedinMatch = parsed.pathname.match(/\/jobs\/view\/(?:.*-)?(\d+)/i);
    if (linkedinMatch) {
      return `linkedin:job:${linkedinMatch[1]}`;
    }

    // 2. Indeed: jk=xxx or vjk=xxx
    const indeedJk = parsed.searchParams.get('jk') || parsed.searchParams.get('vjk');
    if (indeedJk) {
      return `indeed:job:${indeedJk}`;
    }

    // 3. Naukri: job-listings-xxx-id
    const naukriMatch = parsed.pathname.match(/job-listings-.*?([0-9a-zA-Z]{8,})/i);
    if (naukriMatch) {
      return `naukri:job:${naukriMatch[1]}`;
    }

    // 4. Greenhouse: boards.greenhouse.io/<company>/jobs/<id>
    const ghMatch = parsed.pathname.match(/\/jobs\/(\d+)/i);
    if (parsed.hostname.includes('greenhouse.io') && ghMatch) {
      return `greenhouse:job:${ghMatch[1]}`;
    }

    // 5. Lever: jobs.lever.co/<company>/<uuid>
    const leverMatch = parsed.pathname.match(/\/([0-9a-fA-F-]{24,36})/i);
    if (parsed.hostname.includes('lever.co') && leverMatch) {
      return `lever:job:${leverMatch[1]}`;
    }

    // Generic URL: Strip tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'refId', 'trackingId', 'trk', 'trkInfo', 'midToken', 'eid',
      'destRedirect', 'refCode', 'source', 'src', 'from', 'fbclid', 'gclid'
    ];
    for (const p of trackingParams) {
      parsed.searchParams.delete(p);
    }

    // Remove trailing slash and normalize protocol/host
    let clean = `${parsed.hostname.replace(/^www\./, '')}${parsed.pathname.replace(/\/+$/, '')}`;
    const search = parsed.searchParams.toString();
    if (search) clean += `?${search}`;
    return clean.toLowerCase();
  } catch {
    // If not a valid URL structure, normalize by string
    return urlStr.toLowerCase().replace(/^https?:\/\/(?:www\.)?/, '').replace(/[?#].*$/, '').replace(/\/+$/, '');
  }
}

/**
 * Evaluates whether two job objects represent the exact same opportunity.
 */
export function isDuplicateJob(
  jobA: Partial<JobOpportunity> | { company: string; title: string; url?: string; description?: string },
  jobB: Partial<JobOpportunity> | { company: string; title: string; url?: string; description?: string }
): boolean {
  if (!jobA || !jobB) return false;

  // 1. URL / Platform ID Match (Highest Confidence)
  const urlKeyA = normalizeJobUrl(jobA.url);
  const urlKeyB = normalizeJobUrl(jobB.url);
  if (urlKeyA && urlKeyB && urlKeyA === urlKeyB) {
    return true;
  }

  // 2. Cleaned Company Match Key
  const compKeyA = getCompanyMatchKey(jobA.company);
  const compKeyB = getCompanyMatchKey(jobB.company);

  // 3. Cleaned Job Title Match Key
  const titleKeyA = getTitleMatchKey(jobA.title);
  const titleKeyB = getTitleMatchKey(jobB.title);

  // Direct Match on Normalized Company and Normalized Role
  if (compKeyA && compKeyB && compKeyA === compKeyB) {
    // If company match keys are identical and titles are identical or close synonyms
    if (titleKeyA && titleKeyB && (titleKeyA === titleKeyB || titleKeyA.includes(titleKeyB) || titleKeyB.includes(titleKeyA))) {
      return true;
    }

    // Also check direct cleaned title exact equality
    const exactTitleA = cleanJobTitle(jobA.title).toLowerCase();
    const exactTitleB = cleanJobTitle(jobB.title).toLowerCase();
    if (exactTitleA === exactTitleB) {
      return true;
    }
  }

  // Fuzzy Substring Match for Companies (e.g., "Cisco" vs "Cisco Systems" or "Swiggy" vs "Swiggy Tech")
  const isCompanySubstring = 
    compKeyA.length >= 4 && compKeyB.length >= 4 &&
    (compKeyA.includes(compKeyB) || compKeyB.includes(compKeyA));

  if (isCompanySubstring) {
    if (titleKeyA && titleKeyB && (titleKeyA === titleKeyB || titleKeyA.includes(titleKeyB) || titleKeyB.includes(titleKeyA))) {
      return true;
    }
  }

  // Exact Match on Cleaned Display Names as safe fallback
  const cleanCompA = cleanCompanyName(jobA.company).toLowerCase();
  const cleanCompB = cleanCompanyName(jobB.company).toLowerCase();
  const cleanTitleA = cleanJobTitle(jobA.title).toLowerCase();
  const cleanTitleB = cleanJobTitle(jobB.title).toLowerCase();

  if (cleanCompA && cleanCompB && cleanCompA === cleanCompB && cleanTitleA === cleanTitleB) {
    return true;
  }

  return false;
}

/**
 * Deduplicates a list of jobs, keeping the highest quality / latest record for each unique job.
 */
export function deduplicateJobList(jobs: JobOpportunity[]): JobOpportunity[] {
  const uniqueJobs: JobOpportunity[] = [];

  for (const job of jobs) {
    const existingIndex = uniqueJobs.findIndex(u => isDuplicateJob(u, job));

    if (existingIndex === -1) {
      // Clean company and title before saving
      const cleaned: JobOpportunity = {
        ...job,
        company: cleanCompanyName(job.company),
        title: cleanJobTitle(job.title),
      };
      uniqueJobs.push(cleaned);
    } else {
      // Merge best fields: preserve APPLIED status, better description, direct URL
      const existing = uniqueJobs[existingIndex];
      const hasBetterStatus = (job.status === 'APPLIED' || job.status === 'INTERVIEW' || job.status === 'OFFER') && existing.status !== 'APPLIED';
      const hasDirectUrl = job.url && !job.url.includes('mail.google.com') && (!existing.url || existing.url.includes('mail.google.com'));

      uniqueJobs[existingIndex] = {
        ...existing,
        status: hasBetterStatus ? job.status : existing.status,
        appliedDate: job.appliedDate || existing.appliedDate,
        url: hasDirectUrl ? job.url : existing.url,
        company: cleanCompanyName(existing.company || job.company),
        title: cleanJobTitle(existing.title || job.title),
      };
    }
  }

  return uniqueJobs;
}
