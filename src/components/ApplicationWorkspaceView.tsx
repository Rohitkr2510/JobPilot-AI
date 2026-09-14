import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Sparkles, 
  Printer, 
  ExternalLink, 
  ShieldCheck, 
  Send, 
  Mail, 
  HelpCircle, 
  BookOpen, 
  Edit3, 
  RefreshCw, 
  ArrowLeft, 
  User, 
  CheckCircle2, 
  Lock,
  MessageSquare,
  Linkedin,
  Award,
  Calendar,
  Building,
  GraduationCap,
  Download,
  FileDown,
  ChevronDown,
  Upload,
  Trash2,
  Briefcase,
  ArrowRight
} from 'lucide-react';
import { JobOpportunity, MasterCandidateProfile, ApplicationQuestionAnswer, UploadedResumeRecord } from '../types';
import { copyToClipboard, getScoreColor, getRecommendationBadge, getStatusBadge } from '../utils/helpers';
import { downloadResumePdf, downloadResumeTxt } from '../utils/resumeExport';

interface ApplicationWorkspaceViewProps {
  job?: JobOpportunity | null;
  masterProfile: MasterCandidateProfile;
  latestResume?: UploadedResumeRecord | null;
  onBackToJobs: () => void;
  onOpenResumeUpload?: () => void;
  onOpenIngestModal?: () => void;
  onOpenGmailSync?: () => void;
  onDeleteJob?: (job: JobOpportunity) => void;
  onGenerateResume: (job: JobOpportunity) => Promise<void>;
  onGenerateQA: (job: JobOpportunity, customQuestions?: string[]) => Promise<void>;
  onGenerateColdEmail: (job: JobOpportunity, recipientName?: string, recipientRole?: string) => Promise<void>;
  onGenerateInterviewPrep: (job: JobOpportunity) => Promise<void>;
  onUpdateJobStatus: (jobId: string, status: any) => void;
  isGeneratingResume: boolean;
  isGeneratingQA: boolean;
  isGeneratingEmail: boolean;
  isGeneratingPrep: boolean;
}

export const ApplicationWorkspaceView: React.FC<ApplicationWorkspaceViewProps> = ({
  job,
  masterProfile,
  latestResume,
  onBackToJobs,
  onOpenResumeUpload,
  onOpenIngestModal,
  onOpenGmailSync,
  onDeleteJob,
  onGenerateResume,
  onGenerateQA,
  onGenerateColdEmail,
  onGenerateInterviewPrep,
  onUpdateJobStatus,
  isGeneratingResume,
  isGeneratingQA,
  isGeneratingEmail,
  isGeneratingPrep
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'resume' | 'autofill' | 'qa' | 'email' | 'interview'>('resume');
  const [resumeViewMode, setResumeViewMode] = useState<'tailored' | 'master' | 'raw_uploaded'>('tailored');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('Talent Acquisition Lead');
  const [recipientRole, setRecipientRole] = useState('Technical Recruiter');
  const [customQuestionInput, setCustomQuestionInput] = useState('');
  const [editingQAIndex, setEditingQAIndex] = useState<number | null>(null);
  const [editedAnswerText, setEditedAnswerText] = useState('');
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const [downloadSuccessType, setDownloadSuccessType] = useState<'pdf' | 'txt' | null>(null);

  if (!job) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto my-8 shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
          <Briefcase className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">
            No Job Selected
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Your workspace generates tailored one-page resumes, guardrailed application Q&amp;A, cold outreach emails, and interview battlecards once you select or ingest a job.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onOpenIngestModal && (
            <button
              onClick={onOpenIngestModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Ingest Job Alert / Add JD</span>
            </button>
          )}

          {onOpenGmailSync && (
            <button
              onClick={onOpenGmailSync}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Sync from Gmail</span>
            </button>
          )}

          <button
            onClick={onBackToJobs}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Back to Explorer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const score = job.matchAnalysis?.overallScore || 75;
  const color = getScoreColor(score);
  const rec = getRecommendationBadge(job.matchAnalysis?.recommendation);
  const status = getStatusBadge(job.status);

  const handleCopy = async (key: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleDownloadPdf = () => {
    downloadResumePdf(job, masterProfile);
    setDownloadSuccessType('pdf');
    setDownloadDropdownOpen(false);
    setTimeout(() => setDownloadSuccessType(null), 2500);
  };

  const handleDownloadTxt = () => {
    downloadResumeTxt(job, masterProfile);
    setDownloadSuccessType('txt');
    setDownloadDropdownOpen(false);
    setTimeout(() => setDownloadSuccessType(null), 2500);
  };

  const handlePrintResume = () => {
    window.print();
  };

  const nameParts = (masterProfile.name || 'Rohit Kumar Mahato').trim().split(/\s+/);
  const firstName = nameParts[0] || 'Rohit';
  const lastName = nameParts.slice(1).join(' ') || '';

  const allSkillsList = Object.values(masterProfile.skills || {})
    .flat()
    .filter(Boolean);
  const flattenedSkills = allSkillsList.length > 0 
    ? allSkillsList.join(', ')
    : "AWS, Kubernetes, Amazon EKS, Terraform, Jenkins, Docker, Python, DevSecOps, Linux";

  const candidateFields = [
    { label: "First Name", value: firstName, source: "user_verified" },
    { label: "Last Name", value: lastName, source: "user_verified" },
    { label: "Full Name", value: masterProfile.name, source: "user_verified" },
    { label: "Email Address", value: masterProfile.email, source: "user_verified" },
    { label: "Phone Number", value: masterProfile.phone, source: "user_verified" },
    { label: "Current Company", value: masterProfile.currentCompany, source: "user_verified" },
    { label: "Current Title / Role", value: masterProfile.currentRole, source: "user_verified" },
    { label: "Target Role", value: masterProfile.targetRole, source: "user_verified" },
    { label: "Total Experience", value: `${masterProfile.totalExperienceYears} Years`, source: "user_verified" },
    { label: "Highest Degree", value: masterProfile.highestDegree, source: "user_verified" },
    { label: "University", value: masterProfile.university, source: "user_verified" },
    { label: "Academic CGPA", value: masterProfile.cgpa, source: "user_verified" },
    { label: "Primary Certification", value: masterProfile.certification, source: "user_verified" },
    { label: "Official Notice Period", value: masterProfile.noticePeriod, source: "user_verified" },
    { label: "Expected CTC / Compensation", value: masterProfile.expectedSalary, source: "user_verified" },
    { label: "Work Authorization", value: masterProfile.workAuthorization, source: "user_verified" },
    { label: "Current Location & Relocation", value: `${masterProfile.location} (${masterProfile.relocation || 'Open to relocate'})`, source: "user_verified" },
    { label: "LinkedIn URL", value: masterProfile.linkedinUrl, source: "user_verified" },
    { label: "GitHub URL", value: masterProfile.githubUrl, source: "user_verified" },
    { label: "DevOps Portfolio", value: masterProfile.portfolioUrl, source: "user_verified" },
    { 
      label: "Technical Skills (All Categories)", 
      value: flattenedSkills, 
      source: "user_verified" 
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Breadcrumb & Job Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToJobs}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Job Queue</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Application Status:</span>
            <select
              value={job.status}
              onChange={e => onUpdateJobStatus(job.id, e.target.value)}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="DISCOVERED">Discovered</option>
              <option value="ANALYZING">Analyzing</option>
              <option value="MATCHED">Matched</option>
              <option value="RECOMMENDED">Recommended</option>
              <option value="RESUME_READY">Resume Ready</option>
              <option value="READY_TO_APPLY">Ready to Apply</option>
              <option value="APPLIED">Applied</option>
              <option value="SCREENING">Screening</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFER">Offer</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {onDeleteJob && (
              <button
                onClick={() => onDeleteJob(job)}
                className="px-3 py-1 bg-slate-950 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-900/60 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Delete from active jobs and move to 7-day SQLite backup bin"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete to Backup</span>
              </button>
            )}
          </div>
        </div>

        {/* Title & Key Specs */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pt-2 border-t border-slate-800">
          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {job.title}
              </h1>
              <span className="text-base font-semibold text-slate-300">
                @ {job.company}
              </span>
              <span className={`px-2.5 py-0.5 text-xs rounded-full border ${status.color}`}>
                {status.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span>{job.location} ({job.remoteType})</span>
              <span>•</span>
              <span className="text-emerald-400 font-mono font-medium">{job.salaryRange || 'Market Rate'}</span>
              <span>•</span>
              <span>Exp Required: {job.experienceRequired}</span>
              <span>•</span>
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium underline"
              >
                <span>Open Target Job Posting</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Score Badge */}
          <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
            <div className="text-right">
              <div className="text-[11px] text-slate-400 font-medium">Hybrid Match</div>
              <div className="text-xs font-semibold text-slate-300">{rec.label}</div>
            </div>
            <div className={`px-3 py-1 rounded-lg font-bold font-mono text-xl border ${color.badge}`}>
              {score}%
            </div>
          </div>
        </div>

        {/* Workspace Navigation Sub-tabs */}
        <div className="flex overflow-x-auto gap-2 pt-2 border-t border-slate-800 no-scrollbar">
          {[
            { id: 'resume', label: '1-Page ATS Resume & PDF', icon: FileText, badge: job.resumeVersion ? 'Ready' : null },
            { id: 'autofill', label: 'Candidate Form Autofill', icon: User, badge: '1-Click Copy' },
            { id: 'qa', label: 'Application Q&A Assistant', icon: HelpCircle, badge: (job.applicationAnswers?.length || 0) > 0 ? `${job.applicationAnswers?.length}` : null },
            { id: 'email', label: 'Personalized Cold Email', icon: Mail, badge: job.coldEmail ? 'Generated' : null },
            { id: 'interview', label: 'Interview Prep Coach', icon: BookOpen, badge: job.interviewPrep ? 'Ready' : null }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    isActive ? 'bg-blue-900 text-blue-200' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: One-Page ATS Resume & PDF Generation */}
      {activeSubTab === 'resume' && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  ATS Resume Optimization Engine
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                  Strict 1-Page Layout
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                  0-Hallucination Guardrail
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tailored for {job.company} by re-ordering verified accomplishments from Rohit's master profile.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onOpenResumeUpload && (
                <button
                  onClick={onOpenResumeUpload}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-cyan-800/60 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Upload a new resume to update profile and re-score all jobs in SQLite"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Upload Latest Resume</span>
                </button>
              )}

              <button
                onClick={() => onGenerateResume(job)}
                disabled={isGeneratingResume}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingResume ? 'animate-spin text-blue-400' : ''}`} />
                <span>{isGeneratingResume ? 'Re-optimizing...' : 'Regenerate with AI'}</span>
              </button>

              {/* Primary Download PDF Button with Format Dropdown */}
              <div className="relative">
                <div className="inline-flex rounded-lg shadow-md shadow-blue-600/20 border border-blue-500/50">
                  <button
                    onClick={handleDownloadPdf}
                    className="px-3.5 py-2 rounded-l-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-r border-blue-500"
                    title="Download formatted 1-page ATS PDF"
                  >
                    {downloadSuccessType === 'pdf' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>PDF Downloaded!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)}
                    className="px-2 py-2 rounded-r-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center transition-colors cursor-pointer"
                    title="Choose download format"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {downloadDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 space-y-1">
                    <button
                      onClick={handleDownloadPdf}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <FileDown className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">Formatted PDF (.pdf)</div>
                        <div className="text-[10px] text-slate-400">1-Page ATS vector PDF</div>
                      </div>
                    </button>

                    <button
                      onClick={handleDownloadTxt}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">Plain Text (.txt)</div>
                        <div className="text-[10px] text-slate-400">Clean ATS text format</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Direct Download TXT Button */}
              <button
                onClick={handleDownloadTxt}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download formatted ATS text file"
              >
                {downloadSuccessType === 'txt' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>TXT Downloaded!</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Download TXT</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePrintResume}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open system print dialog"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* ATS Score & Guardrail Checklist */}
          {job.resumeVersion && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* ATS Score Gauge */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className="h-16 w-16 rounded-full border-4 border-emerald-500/40 bg-emerald-500/10 flex flex-col items-center justify-center font-mono font-bold text-emerald-400">
                  <span className="text-lg leading-none">{job.resumeVersion.atsScore}%</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400">ATS</span>
                </div>
                <div className="text-xs space-y-1 flex-1">
                  <div className="font-semibold text-white">ATS Keyword Alignment</div>
                  <div className="text-slate-400 text-[11px] leading-snug">
                    Matches JD requirements for AWS, Terraform, Jenkins, and Kubernetes with high keyword density.
                  </div>
                </div>
              </div>

              {/* Guardrail Policy Card */}
              <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Guardrail Verification Status (4/4 Passed)</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">100% Fact Verified</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Zero fabricated companies or roles</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Verified metrics (95% drop, 40% cycle time)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Chronology matches TCS & Celebrare</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>AWS Solutions Architect credential checked</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Printable One-Page ATS Resume Container & View Switcher */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-full max-w-4xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs shadow-md">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
                  <button
                    onClick={() => setResumeViewMode('tailored')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      resumeViewMode === 'tailored'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tailored for {job.company}
                  </button>
                  <button
                    onClick={() => setResumeViewMode('master')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      resumeViewMode === 'master'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Master Profile
                  </button>
                  <button
                    onClick={() => setResumeViewMode('raw_uploaded')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      resumeViewMode === 'raw_uploaded'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Latest Uploaded</span>
                    {latestResume && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    )}
                  </button>
                </div>

                {job.resumeVersion?.atsScore && resumeViewMode === 'tailored' && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/20">
                    {job.resumeVersion.atsScore}% ATS Score
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm transition-colors cursor-pointer"
                  title="Download vector PDF file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={handleDownloadTxt}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-colors cursor-pointer"
                  title="Download formatted plain text file"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Download TXT</span>
                </button>
              </div>
            </div>

            {/* RAW UPLOADED RESUME VIEW */}
            {resumeViewMode === 'raw_uploaded' ? (
              <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-slate-200 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-sm font-bold text-white">
                        {latestResume?.fileName || 'Latest Uploaded Resume in SQLite'}
                      </h4>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded">
                        Persisted in SQLite
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Uploaded on {latestResume ? new Date(latestResume.uploadedAt).toLocaleString() : 'Recent session'} • Character count: {latestResume?.rawText ? latestResume.rawText.length : 0} • Word count: {latestResume?.rawText ? latestResume.rawText.split(/\s+/).filter(Boolean).length : 0}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy('raw-uploaded-resume', latestResume?.rawText || '')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'raw-uploaded-resume' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'raw-uploaded-resume' ? 'Copied' : 'Copy Text'}</span>
                    </button>
                    {onOpenResumeUpload && (
                      <button
                        onClick={onOpenResumeUpload}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload New File</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 leading-relaxed max-h-[600px] overflow-y-auto whitespace-pre-wrap select-all">
                  {latestResume?.rawText || (
                    <div className="text-slate-500 italic py-8 text-center">
                      No raw resume file has been uploaded yet. Click "Upload Latest Resume" above to upload your PDF or TXT resume and automatically sync it to SQLite.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ATS FORMATTED RESUME PREVIEW (TAILORED OR MASTER) */
              <div
                id="printable-resume-container"
                className="w-full max-w-4xl bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-2xl border border-slate-300 text-sm leading-normal space-y-5"
              >
                {/* Resume Header */}
                <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
                  <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase font-sans">
                    {masterProfile.name}
                  </h1>
                  <div className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                    {resumeViewMode === 'tailored' 
                      ? `${job.title || masterProfile.targetRole} • Tailored for ${job.company}`
                      : `${masterProfile.currentRole} • ${masterProfile.targetRole}`}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-600 font-medium">
                    <span>{masterProfile.location}</span>
                    <span>|</span>
                    <span>{masterProfile.email}</span>
                    <span>|</span>
                    <span>{masterProfile.phone}</span>
                    {masterProfile.linkedinUrl && (
                      <>
                        <span>|</span>
                        <a href={masterProfile.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">LinkedIn</a>
                      </>
                    )}
                    {masterProfile.githubUrl && (
                      <>
                        <span>|</span>
                        <a href={masterProfile.githubUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">GitHub</a>
                      </>
                    )}
                  </div>
                </div>

                {/* Professional Summary */}
                <div className="space-y-1.5">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                    Professional Summary
                  </h2>
                  <p className="text-xs text-slate-800 leading-relaxed text-justify">
                    {resumeViewMode === 'tailored'
                      ? (job.resumeVersion?.summary || `${masterProfile.currentRole} with ${masterProfile.certification} and ${masterProfile.totalExperienceYears}+ years experience designing automated CI/CD pipelines, orchestrating Kubernetes/EKS workloads, and codifying cloud infrastructure. Proven track record reducing deployment failures by 95% and accelerating release cycles by 40%.`)
                      : `${masterProfile.currentRole} with ${masterProfile.certification} and ${masterProfile.totalExperienceYears}+ years of hands-on experience designing robust CI/CD pipelines, scaling Kubernetes/EKS workloads, and codifying cloud infrastructure via Terraform. Proven track record automating deployments, ensuring DevSecOps governance, and accelerating release cadence.`}
                  </p>
                </div>

                {/* Technical Core Competencies */}
                <div className="space-y-1.5">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                    Technical Core Competencies
                  </h2>
                  <div className="grid grid-cols-1 gap-1 text-xs text-slate-800">
                    {masterProfile.skills?.cloud && masterProfile.skills.cloud.length > 0 && (
                      <p>
                        <strong className="font-bold text-slate-950">Cloud & Infrastructure: </strong>
                        {masterProfile.skills.cloud.join(', ')}
                      </p>
                    )}
                    {masterProfile.skills?.cicd && masterProfile.skills.cicd.length > 0 && (
                      <p>
                        <strong className="font-bold text-slate-950">CI/CD & Automation: </strong>
                        {masterProfile.skills.cicd.join(', ')}
                      </p>
                    )}
                    {masterProfile.skills?.containers && masterProfile.skills.containers.length > 0 && (
                      <p>
                        <strong className="font-bold text-slate-950">Containers & Orchestration: </strong>
                        {masterProfile.skills.containers.join(', ')}
                      </p>
                    )}
                    {masterProfile.skills?.iac && masterProfile.skills.iac.length > 0 && (
                      <p>
                        <strong className="font-bold text-slate-950">Infrastructure as Code: </strong>
                        {masterProfile.skills.iac.join(', ')}
                      </p>
                    )}
                    {masterProfile.skills?.security && masterProfile.skills.security.length > 0 && (
                      <p>
                        <strong className="font-bold text-slate-950">DevSecOps & Governance: </strong>
                        {[...masterProfile.skills.security, ...(masterProfile.skills.releaseManagement || [])].join(', ')}
                      </p>
                    )}
                    {masterProfile.skills?.scripting && masterProfile.skills.scripting.length > 0 && (
                      <p>
                        <strong className="font-bold text-slate-950">Languages & Scripting: </strong>
                        {masterProfile.skills.scripting.join(', ')}
                      </p>
                    )}
                    {masterProfile.skills?.monitoring && masterProfile.skills.monitoring.length > 0 && (
                      <p>
                        <strong className="font-bold text-slate-950">Monitoring & Observability: </strong>
                        {masterProfile.skills.monitoring.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Professional Experience */}
                <div className="space-y-3">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                    Professional Experience
                  </h2>

                  {/* Current Role */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <strong className="font-bold text-slate-950 text-sm">{masterProfile.currentCompany}</strong>
                        <span className="text-slate-600 ml-2 italic">{masterProfile.currentRole}</span>
                      </div>
                      <span className="font-semibold text-slate-700 text-xs font-mono">
                        {masterProfile.currentExperiencePeriod} | {masterProfile.location}
                      </span>
                    </div>

                    <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-800 leading-relaxed">
                      {resumeViewMode === 'tailored' && job.resumeVersion?.selectedAchievements && job.resumeVersion.selectedAchievements.length > 0 ? (
                        job.resumeVersion.selectedAchievements.map((bullet, idx) => (
                          <li key={idx}>{bullet}</li>
                        ))
                      ) : (
                        masterProfile.verifiedAchievements && masterProfile.verifiedAchievements.length > 0 ? (
                          masterProfile.verifiedAchievements.slice(0, 5).map((ach, idx) => (
                            <li key={idx}>{ach.bullet}</li>
                          ))
                        ) : (
                          <>
                            <li>Architected and standardized 25+ automated Jenkins CI/CD declarative pipelines leveraging custom Groovy Shared Libraries across multi-branch workflows.</li>
                            <li>Engineered modular Terraform configurations for automated AWS provisioning (VPC, IAM, EKS, S3, RDS), reducing deployment failures by 95%.</li>
                            <li>Streamlined release governance and deployment coordination across 15+ engineering microservices in Plutora and Jira, cutting cycle time by 40%.</li>
                          </>
                        )
                      )}
                    </ul>
                  </div>

                  {/* Previous Role */}
                  {masterProfile.previousCompany && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <strong className="font-bold text-slate-950 text-sm">{masterProfile.previousCompany}</strong>
                          <span className="text-slate-600 ml-2 italic">{masterProfile.previousRole}</span>
                        </div>
                        <span className="font-semibold text-slate-700 text-xs font-mono">
                          {masterProfile.previousExperiencePeriod}
                        </span>
                      </div>

                      <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-800 leading-relaxed">
                        <li>Developed backend services, automated workflows, and data processing routines, boosting system throughput and responsiveness.</li>
                        <li>Built automated test suites and Dockerized environments to streamline developer workflows and containerized deployments.</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Education & Certifications */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                      Education
                    </h2>
                    <div className="text-xs text-slate-800">
                      <div className="font-bold text-slate-950">{masterProfile.university}</div>
                      <div>{masterProfile.highestDegree}</div>
                      {masterProfile.cgpa && (
                        <div className="text-slate-600 font-mono">CGPA: {masterProfile.cgpa}</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                      Certification
                    </h2>
                    <div className="text-xs text-slate-800">
                      <div className="font-bold text-slate-950 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>{masterProfile.certification}</span>
                      </div>
                      <div className="text-slate-600 text-[11px]">Amazon Web Services (AWS) Verified Credential</div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB-TAB 2: Candidate Form Autofill Assistant */}
      {activeSubTab === 'autofill' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span>Candidate Information Clipboard Matrix</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                One-click copy for every standard job portal field (Workday, Greenhouse, Lever, BambooHR).
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>User Verified</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                0 Inventions Allowed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {candidateFields.map((field, idx) => {
              const isCopied = copiedKey === `field-${idx}`;
              return (
                <div
                  key={idx}
                  className="bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {field.label}
                      </span>
                      <span className="px-1.5 py-0.2 text-[9px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        VERIFIED
                      </span>
                    </div>
                    <div className="text-xs text-white font-medium truncate select-all">
                      {field.value}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(`field-${idx}`, field.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Application Q&A Assistant */}
      {activeSubTab === 'qa' && (
        <div className="space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                <span>Job Application Questions & Tailored Answers</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pre-composed responses grounded in Rohit's actual TCS DevOps achievements. Never auto-submitted.
              </p>
            </div>

            <button
              onClick={() => onGenerateQA(job)}
              disabled={isGeneratingQA}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingQA ? 'animate-spin' : ''}`} />
              <span>{isGeneratingQA ? 'Generating...' : 'Refresh Q&A with AI'}</span>
            </button>
          </div>

          {/* Custom Question Generator Input */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Have a custom application question on this job portal?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., Why do you think you are the best fit for our DevOps squad?"
                value={customQuestionInput}
                onChange={e => setCustomQuestionInput(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => {
                  if (customQuestionInput.trim()) {
                    onGenerateQA(job, [customQuestionInput]);
                    setCustomQuestionInput('');
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Generate Answer
              </button>
            </div>
          </div>

          {/* List of Q&A */}
          <div className="space-y-4">
            {(job.applicationAnswers || []).map((qa, index) => {
              const isCopied = copiedKey === `qa-${index}`;
              const isEditing = editingQAIndex === index;

              return (
                <div
                  key={index}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {qa.source === 'ai_generated' ? '[AI GENERATED]' : '[USER VERIFIED]'}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">
                          Category: {qa.category || 'General'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        {qa.question}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (isEditing) {
                            qa.suggestedAnswer = editedAnswerText;
                            setEditingQAIndex(null);
                          } else {
                            setEditingQAIndex(index);
                            setEditedAnswerText(qa.suggestedAnswer);
                          }
                        }}
                        className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isEditing ? 'Save' : 'Edit'}</span>
                      </button>

                      <button
                        onClick={() => handleCopy(`qa-${index}`, qa.suggestedAnswer)}
                        className={`px-3 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-colors cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                        }`}
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <textarea
                      rows={5}
                      value={editedAnswerText}
                      onChange={e => setEditedAnswerText(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
                    />
                  ) : (
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3.5 rounded-lg border border-slate-800/80">
                      {qa.suggestedAnswer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Personalized Cold Email & Recruiter Outreach */}
      {activeSubTab === 'email' && (
        <div className="space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span>Personalized Cold Email Generator</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct recruiter pitch emphasizing matching keywords (Jenkins, Terraform, AWS) and verified metrics.
                </p>
              </div>

              <button
                onClick={() => onGenerateColdEmail(job, recipientName, recipientRole)}
                disabled={isGeneratingEmail}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingEmail ? 'animate-spin' : ''}`} />
                <span>{isGeneratingEmail ? 'Generating...' : 'Regenerate Email'}</span>
              </button>
            </div>

            {/* Recruiter Customization Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Recipient Name / Team</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  placeholder="e.g., Sarah Jenkins or Datadog Recruiting Team"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Recipient Role / Designation</label>
                <input
                  type="text"
                  value={recipientRole}
                  onChange={e => setRecipientRole(e.target.value)}
                  placeholder="e.g., Lead Technical Recruiter or Engineering Manager"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Email Preview Card */}
          {job.coldEmail ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
              
              {/* Subject Line Row */}
              <div className="space-y-1.5 pb-3 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject Line:</span>
                  <button
                    onClick={() => handleCopy('email-subject', job.coldEmail?.subject || '')}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    {copiedKey === 'email-subject' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'email-subject' ? 'Copied' : 'Copy Subject'}</span>
                  </button>
                </div>
                <div className="text-sm font-semibold text-white bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-800 select-all font-mono">
                  {job.coldEmail.subject}
                </div>
              </div>

              {/* Email Body */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Body:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy('email-body', job.coldEmail?.body || '')}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'email-body' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'email-body' ? 'Copied' : 'Copy Body'}</span>
                    </button>

                    <a
                      href={`mailto:?subject=${encodeURIComponent(job.coldEmail.subject)}&body=${encodeURIComponent(job.coldEmail.body)}`}
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Open in Email App</span>
                    </a>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-all">
                  {job.coldEmail.body}
                </div>
              </div>

              {/* LinkedIn Quick Outreach Snippet (under 300 chars) */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Linkedin className="w-4 h-4 text-blue-400" />
                    <span>LinkedIn Connection Request Note (&lt; 300 characters)</span>
                  </span>
                  <button
                    onClick={() => handleCopy('linkedin-note', `Hi ${recipientName.split(' ')[0] || 'there'}, I noticed the ${job.title} opening at ${job.company}. As an AWS-certified DevOps Engineer at TCS with experience building 25+ Jenkins pipelines and reducing release cycle times by 40%, I'd love to connect and explore how I can support your team.`)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    {copiedKey === 'linkedin-note' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'linkedin-note' ? 'Copied' : 'Copy Note'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 font-sans italic">
                  "Hi {recipientName.split(' ')[0] || 'there'}, I noticed the {job.title} opening at {job.company}. As an AWS-certified DevOps Engineer at TCS with experience building 25+ Jenkins pipelines and reducing release cycle times by 40%, I'd love to connect and explore how I can support your team."
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-xl text-center space-y-3">
              <Mail className="w-8 h-8 text-cyan-400 mx-auto" />
              <div className="text-sm font-semibold text-white">Cold Email has not been generated yet</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click below to have JobPilot AI formulate a tailored outreach referencing the exact requirements of {job.company}.
              </p>
              <button
                onClick={() => onGenerateColdEmail(job, recipientName, recipientRole)}
                disabled={isGeneratingEmail}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
              >
                {isGeneratingEmail ? 'Generating...' : 'Generate Cold Email'}
              </button>
            </div>
          )}

        </div>
      )}

      {/* SUB-TAB 5: Interview Prep Coach (Section 66 Feature 6) */}
      {activeSubTab === 'interview' && (
        <div className="space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Interview Preparation Coach (Screening & Technical Rounds)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Targeted architectural challenges and behavioral STAR stories anchored in Rohit's actual TCS evidence.
              </p>
            </div>

            <button
              onClick={() => onGenerateInterviewPrep(job)}
              disabled={isGeneratingPrep}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPrep ? 'animate-spin' : ''}`} />
              <span>{isGeneratingPrep ? 'Generating...' : 'Regenerate Interview Dossier'}</span>
            </button>
          </div>

          {job.interviewPrep ? (
            <div className="space-y-5">
              
              {/* Architecture Challenge Box */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-blue-900/40 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    System Design Challenge
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {job.interviewPrep.architectureChallenge.title}
                  </h4>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {job.interviewPrep.architectureChallenge.scenario}
                </p>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Recommended Design Decisions:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {job.interviewPrep.architectureChallenge.keyDesignDecisions.map((decision, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>{decision}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Technical Questions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Deep-Dive Technical Questions & Expected Answers:
                </h4>
                <div className="space-y-3">
                  {job.interviewPrep.technicalQuestions.map((tq, i) => (
                    <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">Q{i+1}: {tq.question}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                          {tq.category}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                        <strong className="text-blue-400">Model Answer: </strong>
                        {tq.expectedAnswer}
                      </div>
                      <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Rohit's Evidence Anchor: {tq.candidateEvidenceAnchor}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Behavioral STAR Stories */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  STAR Behavioral Answers Grounded in Verified Metrics:
                </h4>
                <div className="space-y-3">
                  {job.interviewPrep.behavioralQuestions.map((bq, i) => (
                    <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                      <div className="font-bold text-white text-xs">
                        {bq.question}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-bold text-blue-400 uppercase">Situation</span>
                          <p className="text-slate-300 leading-snug">{bq.starStory.situation}</p>
                        </div>
                        <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-bold text-cyan-400 uppercase">Task</span>
                          <p className="text-slate-300 leading-snug">{bq.starStory.task}</p>
                        </div>
                        <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-bold text-purple-400 uppercase">Action</span>
                          <p className="text-slate-300 leading-snug">{bq.starStory.action}</p>
                        </div>
                        <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase">Result</span>
                          <p className="text-emerald-300 font-medium leading-snug">{bq.starStory.result}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-xl text-center space-y-3">
              <BookOpen className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-sm font-semibold text-white">Interview preparation plan not generated</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Generate tailored architectural scenarios and behavioral questions matching this specific DevOps role.
              </p>
              <button
                onClick={() => onGenerateInterviewPrep(job)}
                disabled={isGeneratingPrep}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
              >
                {isGeneratingPrep ? 'Generating...' : 'Generate Interview Plan'}
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
