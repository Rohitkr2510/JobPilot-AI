import React from 'react';
import { 
  Briefcase, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  ExternalLink, 
  FileCheck, 
  ShieldAlert, 
  TrendingUp,
  Mail,
  Zap,
  Bot,
  Upload,
  Database,
  Calendar,
  Archive
} from 'lucide-react';
import { JobOpportunity } from '../types';
import { getScoreColor, getRecommendationBadge, getStatusBadge } from '../utils/helpers';

interface DashboardViewProps {
  jobs: JobOpportunity[];
  masterProfile?: any;
  onSelectJob: (job: JobOpportunity) => void;
  onOpenIngestModal: () => void;
  onOpenGmailSync?: () => void;
  onOpenResumeUpload?: () => void;
  onOpenSqliteDaily?: () => void;
  onOpenBackupBin?: () => void;
  setActiveTab?: (tab: string) => void;
  onNavigateToJobs?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  jobs,
  masterProfile,
  onSelectJob,
  onOpenIngestModal,
  onOpenGmailSync,
  onOpenResumeUpload,
  onOpenSqliteDaily,
  onOpenBackupBin,
  setActiveTab,
  onNavigateToJobs
}) => {
  const handleNav = (tab: string) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tab);
    } else if (tab === 'jobs' && typeof onNavigateToJobs === 'function') {
      onNavigateToJobs();
    }
  };

  const strongMatches = jobs.filter(j => (j.matchAnalysis?.overallScore || 0) >= 90);
  const recommended = jobs.filter(j => j.status === 'RECOMMENDED' || j.status === 'READY_TO_APPLY');
  const resumesGenerated = jobs.filter(j => !!j.resumeVersion);
  const appliedJobs = jobs.filter(j => j.status === 'APPLIED' || j.status === 'SCREENING' || j.status === 'INTERVIEW');

  // Follow-up due: applied > 2 days ago in demo context
  const followUpsDue = appliedJobs.filter(j => {
    if (!j.appliedDate) return false;
    const appliedTime = new Date(j.appliedDate).getTime();
    const now = new Date('2026-09-13T14:16:14-07:00').getTime();
    const days = (now - appliedTime) / (1000 * 60 * 60 * 24);
    return days >= 1; // 1+ days in active tracking
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome Briefing */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                SQLite Active • Local Daily Automation
              </span>
              <span className="text-xs text-slate-400 font-mono">Today: Sep 13, 2026</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Good morning, {masterProfile?.name?.split(' ')[0] || 'Rohit'}.
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              JobPilot AI has identified <strong className="text-white font-semibold">{strongMatches.length} high-priority DevOps positions</strong> matching your 25+ Jenkins pipelines, AWS infrastructure, and Terraform achievements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenIngestModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Zap className="w-4 h-4 text-cyan-200" />
              <span>Ingest Alert / Add JD</span>
            </button>
            <button
              onClick={() => handleNav('jobs')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>View All ({jobs.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Interactive Cards: Gmail, Resume Upload, SQLite Daily Routine, Backup Bin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gmail Job Alert Sync */}
        <div 
          onClick={onOpenGmailSync}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-red-500/40 transition-all cursor-pointer group shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-red-300 flex items-center gap-1">
              Sync Inbox <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <h3 className="text-sm font-bold text-white mt-3 group-hover:text-red-200 transition-colors">
            Gmail Job Alerts Reader
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Link your Gmail to automatically scan for LinkedIn, Indeed, and recruiter job alerts.
          </p>
        </div>

        {/* Card 2: Upload Recent Resume & Auto-Update */}
        <div 
          onClick={onOpenResumeUpload}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-cyan-300 flex items-center gap-1">
              Parse & Update <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <h3 className="text-sm font-bold text-white mt-3 group-hover:text-cyan-200 transition-colors">
            Upload & Parse Recent Resume
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Upload your latest resume. Updates all candidate skills, achievements, and re-scores jobs in SQLite.
          </p>
        </div>

        {/* Card 3: Daily SQLite Job Assistant */}
        <div 
          onClick={onOpenSqliteDaily}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-amber-300 flex items-center gap-1">
              Daily Routine <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <h3 className="text-sm font-bold text-white mt-3 group-hover:text-amber-200 transition-colors">
            SQLite Daily Job Routine
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Track daily application checklist, inspect local <code className="text-slate-300">jobpilot.db</code>, and export backups.
          </p>
        </div>

        {/* Card 4: 7-Day Backup Bin */}
        <div 
          onClick={onOpenBackupBin}
          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Archive className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-amber-300 flex items-center gap-1">
              Backup & Restore <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <h3 className="text-sm font-bold text-white mt-3 group-hover:text-amber-200 transition-colors">
            7-Day SQLite Backup Bin
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Deleted opportunities are safely preserved for 7 days before purge. Restore anytime with 1 click.
          </p>
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">New Jobs</span>
            <Briefcase className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{jobs.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Ingested from alerts</div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Strong Matches</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{strongMatches.length}</div>
            <div className="text-[11px] text-emerald-500/80 mt-0.5">90%+ match score</div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Recommended</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400">{recommended.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Ready for review</div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Resumes Ready</span>
            <FileCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">{resumesGenerated.length}</div>
            <div className="text-[11px] text-purple-400/80 mt-0.5">Tailored one-pagers</div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">In Pipeline</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-400">{appliedJobs.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Applied / Screening</div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Follow-ups Due</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">{followUpsDue.length}</div>
            <div className="text-[11px] text-amber-500/80 mt-0.5">&gt; 24h since apply</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Priority Action Board & Live Agent Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: High Priority Today Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Priority Action Queue</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Top Recommended
                </span>
              </h2>
            </div>
            <button
              onClick={() => handleNav('jobs')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <span>Open Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {jobs.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">No Jobs Ingested Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Connect your Gmail to sync live job alerts or ingest a JD to let JobPilot AI run 7-factor matching and tailored materials.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    onClick={onOpenIngestModal}
                    className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-200" />
                    <span>Ingest Job JD</span>
                  </button>
                  {onOpenGmailSync && (
                    <button
                      onClick={onOpenGmailSync}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sync Gmail Alerts</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              jobs.slice(0, 3).map((job) => {
                const score = job.matchAnalysis?.overallScore || 70;
                const color = getScoreColor(score);
                const rec = getRecommendationBadge(job.matchAnalysis?.recommendation);
                const status = getStatusBadge(job.status);

                return (
                  <div
                    key={job.id}
                    className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all shadow-md group relative"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      
                      {/* Job Details */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                            {job.title}
                          </span>
                          <span className="text-xs font-medium text-slate-400">
                            @ <strong className="text-slate-200">{job.company}</strong>
                          </span>
                          <span className={`px-2 py-0.5 text-[11px] rounded-md border ${status.color}`}>
                            {status.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span>{job.location} ({job.remoteType})</span>
                          <span>•</span>
                          <span className="text-slate-300 font-mono">{job.salaryRange || 'Competitive CTC'}</span>
                          <span>•</span>
                          <span>{job.experienceRequired}</span>
                        </div>

                        {/* Matching Chips */}
                        {job.matchAnalysis && (
                          <div className="pt-2 flex flex-wrap gap-1.5">
                            {job.matchAnalysis.strongMatches.slice(0, 4).map((tech, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-[11px] rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1"
                              >
                                <span className="text-emerald-400 font-bold">✓</span>
                                <span>{tech}</span>
                              </span>
                            ))}
                            {job.matchAnalysis.missingSkills.slice(0, 1).map((miss, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-[11px] rounded bg-rose-950/40 text-rose-300 border border-rose-800/40 flex items-center gap-1"
                              >
                                <span className="text-rose-400">✗</span>
                                <span>Missing: {miss}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Brief Reasoning Snippet */}
                        {job.matchAnalysis?.reasoning && (
                          <p className="text-xs text-slate-400 line-clamp-1 italic pt-1">
                            "{job.matchAnalysis.reasoning}"
                          </p>
                        )}
                      </div>

                      {/* Score Badge & Action Button */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                        <div className="text-right flex items-center sm:flex-col gap-2 sm:gap-0">
                          <div className={`px-3 py-1 rounded-xl font-bold font-mono text-lg border ${color.badge}`}>
                            {score}%
                          </div>
                          <div className="text-[10px] text-slate-400 sm:mt-1">
                            {rec.label}
                          </div>
                        </div>

                        <button
                          onClick={() => onSelectJob(job)}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Workspace</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Agent Engine Status & Guardrails */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-400" />
              <span>Multi-Agent Orchestrator</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-medium text-slate-200">Discovery Agent</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Gmail / Alerts</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-medium text-slate-200">Hybrid Match Engine</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">7-Factor Score</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-medium text-slate-200">Resume Optimizer</span>
                </div>
                <span className="text-[11px] text-purple-400 font-mono">ATS 1-Page PDF</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-medium text-slate-200">Guardrail Validator</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">0 Fabrication</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-medium text-slate-200">Cold Email Agent</span>
                </div>
                <span className="text-[11px] text-cyan-400 font-mono">Tailored Outreach</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Model Engine:</span>
                <span className="font-mono text-cyan-300 font-medium">gemini-3.8-flash</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                <span>Guardrail Policy:</span>
                <span className="font-mono text-emerald-400 font-medium">Strict Verification</span>
              </div>
            </div>
          </div>

          {/* Quick Profile Verification Capsule */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>Fact-Checked Evidence</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every resume generated by JobPilot AI strictly references Rohit's verified achievements:
            </p>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 mt-0.5">✓</span>
                <span>25+ Jenkins CI/CD pipelines with Shared Libraries</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 mt-0.5">✓</span>
                <span>95% failure reduction with Terraform AWS IaC</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 mt-0.5">✓</span>
                <span>40% release cycle reduction in Plutora/Jira</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 mt-0.5">✓</span>
                <span>50% MTTR reduction with CloudWatch telemetry</span>
              </li>
            </ul>
            <button
              onClick={() => handleNav('profile')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors pt-1 cursor-pointer"
            >
              <span>Inspect Master Evidence Bank</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
