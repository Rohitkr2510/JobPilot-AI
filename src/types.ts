export interface MasterCandidateProfile {
  name: string;
  targetRole: string;
  email: string;
  phone: string;
  location: string;
  portfolioUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  leetcodeUrl?: string;
  credlyUrl?: string;
  projects?: { title: string; repoUrl: string; description?: string }[];
  currentCompany: string;
  currentRole: string;
  currentExperiencePeriod: string;
  previousCompany: string;
  previousRole: string;
  previousExperiencePeriod: string;
  totalExperienceYears: number;
  highestDegree: string;
  university: string;
  cgpa: string;
  certification: string;
  noticePeriod: string;
  expectedSalary: string;
  workAuthorization: string;
  relocation: string;
  skills: {
    cloud: string[];
    containers: string[];
    cicd: string[];
    iac: string[];
    scripting: string[];
    security: string[];
    releaseManagement: string[];
    monitoring: string[];
  };
  verifiedAchievements: {
    id: string;
    category: 'cicd' | 'cloud_iac' | 'security' | 'release' | 'monitoring' | 'python';
    bullet: string;
    metrics: string;
    verified: boolean;
  }[];
}

export type JobStatus =
  | 'DISCOVERED'
  | 'ANALYZING'
  | 'MATCHED'
  | 'RECOMMENDED'
  | 'RESUME_READY'
  | 'READY_TO_APPLY'
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED';

export type RecommendationLevel =
  | 'STRONG_APPLY'
  | 'APPLY'
  | 'REVIEW'
  | 'LOW_PRIORITY'
  | 'SKIP';

export interface MatchAnalysis {
  overallScore: number;
  technicalScore: number;
  experienceScore: number;
  cloudScore: number;
  cicdScore: number;
  seniorityScore: number;
  locationScore: number;
  certificationScore: number;
  strongMatches: string[];
  partialMatches: string[];
  missingSkills: string[];
  recommendation: RecommendationLevel;
  reasoning: string;
  extractedKeySkills: string[];
  roleQualityScore: number;
}

export interface ResumeVersion {
  id: string;
  jobId: string;
  versionName: string;
  createdAt: string;
  summary: string;
  prioritizedSkills: string[];
  selectedAchievements: string[];
  atsScore: number;
  atsFeedback: string[];
  guardrailChecks: {
    passed: boolean;
    rule: string;
    detail: string;
  }[];
}

export interface ApplicationQuestionAnswer {
  question: string;
  suggestedAnswer: string;
  userEditedAnswer?: string;
  category: 'motivation' | 'devops_tech' | 'culture' | 'logistics';
  source: 'ai_generated' | 'user_verified';
}

export interface ColdEmailDraft {
  subject: string;
  body: string;
  recipientName: string;
  recipientRole: string;
  keyHighlightsMentioned: string[];
  generatedAt: string;
}

export interface InterviewPrepPlan {
  roleFocus: string;
  technicalQuestions: {
    question: string;
    expectedAnswer: string;
    candidateEvidenceAnchor: string;
    category: 'AWS' | 'Kubernetes' | 'CI/CD' | 'Terraform' | 'DevSecOps';
  }[];
  behavioralQuestions: {
    question: string;
    starStory: {
      situation: string;
      task: string;
      action: string;
      result: string;
    };
  }[];
  architectureChallenge: {
    title: string;
    scenario: string;
    keyDesignDecisions: string[];
  };
}

export interface JobOpportunity {
  id: string;
  company: string;
  title: string;
  location: string;
  remoteType: 'Remote' | 'Hybrid' | 'On-site';
  salaryRange: string;
  url: string;
  source: 'gmail_alert' | 'linkedin' | 'direct_url' | 'indeed';
  postedDate: string;
  discoveredDate: string;
  deadline?: string;
  experienceRequired: string;
  employmentType: 'Full-time' | 'Contract';
  description: string;
  status: JobStatus;
  matchAnalysis?: MatchAnalysis;
  resumeVersion?: ResumeVersion;
  applicationAnswers?: ApplicationQuestionAnswer[];
  coldEmail?: ColdEmailDraft;
  interviewPrep?: InterviewPrepPlan;
  appliedDate?: string;
  notes?: string;
}

export interface ScoringWeights {
  technical: number;
  experience: number;
  cloud: number;
  cicd: number;
  seniority: number;
  location: number;
  certification: number;
}

export interface BackupJob {
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
}

export interface UploadedResumeRecord {
  id: string;
  fileName: string;
  fileType?: string;
  rawText: string;
  uploadedAt: string;
  fileSizeBytes?: number;
  wordCount?: number;
  charCount?: number;
  parsedProfileSnapshot?: MasterCandidateProfile;
  isActive?: boolean;
}
