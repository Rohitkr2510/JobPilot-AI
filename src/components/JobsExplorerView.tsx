import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal,
  FileCheck2,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Archive
} from 'lucide-react';
import { JobOpportunity, JobStatus, RecommendationLevel } from '../types';
import { getScoreColor, getRecommendationBadge, getStatusBadge } from '../utils/helpers';

interface JobsExplorerViewProps {
  jobs: JobOpportunity[];
  onSelectJob: (job: JobOpportunity) => void;
  onUpdateJobStatus: (jobId: string, status: JobStatus) => void;
  onReanalyzeJob: (job: JobOpportunity) => Promise<void>;
  onRescoreAllJobs?: () => Promise<void>;
  onDeleteJob?: (job: JobOpportunity) => void;
  onOpenBackupBin?: () => void;
  isAnalyzingId: string | null;
  isRescoringAll?: boolean;
}

export const JobsExplorerView: React.FC<JobsExplorerViewProps> = ({
  jobs,
  onSelectJob,
  onUpdateJobStatus,
  onReanalyzeJob,
  onRescoreAllJobs,
  onDeleteJob,
  onOpenBackupBin,
  isAnalyzingId,
  isRescoringAll = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScore, setFilterScore] = useState<'ALL' | 'STRONG_APPLY' | 'APPLY' | 'REVIEW' | 'SKIP'>('ALL');
  const [filterSource, setFilterSource] = useState<'ALL' | 'gmail_alert' | 'direct_url' | 'linkedin'>('ALL');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedBreakdownId, setExpandedBreakdownId] = useState<string | null>(null);

  const tags = ["AWS", "Terraform", "Jenkins", "Kubernetes", "DevSecOps", "Docker", "Python", "Release Management"];

  const filteredJobs = jobs.filter(job => {
    // Search
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.description.toLowerCase().includes(q) ||
      (job.matchAnalysis?.extractedKeySkills || []).some(s => s.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // Score recommendation filter
    if (filterScore !== 'ALL') {
      if (filterScore === 'STRONG_APPLY' && (job.matchAnalysis?.overallScore || 0) < 90) return false;
      if (filterScore === 'APPLY' && ((job.matchAnalysis?.overallScore || 0) < 80 || (job.matchAnalysis?.overallScore || 0) >= 90)) return false;
      if (filterScore === 'REVIEW' && ((job.matchAnalysis?.overallScore || 0) < 70 || (job.matchAnalysis?.overallScore || 0) >= 80)) return false;
      if (filterScore === 'SKIP' && (job.matchAnalysis?.overallScore || 0) >= 70) return false;
    }

    // Source filter
    if (filterSource !== 'ALL' && job.source !== filterSource) return false;

    // Tag filter
    if (selectedTag) {
      const allText = (job.description + ' ' + job.title + ' ' + (job.matchAnalysis?.extractedKeySkills || []).join(' ')).toLowerCase();
      if (!allText.includes(selectedTag.toLowerCase())) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header with Search and Quick Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              DevOps Job Queue & Hybrid Matcher
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated 7-factor matching against Rohit's master resume and verified achievements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span>Showing: <strong className="text-white">{filteredJobs.length}</strong> of {jobs.length} jobs</span>
            </div>
            {onRescoreAllJobs && (
              <button
                onClick={onRescoreAllJobs}
                disabled={isRescoringAll}
                className="px-3 py-1.5 rounded-lg bg-blue-950/50 hover:bg-blue-900/60 text-blue-300 border border-blue-800/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                title="Re-run 7-factor matching across all ingested jobs against Rohit's active profile"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRescoringAll ? 'animate-spin' : ''}`} />
                <span>{isRescoringAll ? 'Re-analyzing...' : 'Re-analyze All Jobs'}</span>
              </button>
            )}
            {onOpenBackupBin && (
              <button
                onClick={onOpenBackupBin}
                className="px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Archive className="w-3.5 h-3.5 text-amber-400" />
                <span>Backup Bin (7-Day)</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar & Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, company, or tech (e.g. Terraform, Jenkins, EKS)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Match Score Filter */}
          <div>
            <select
              value={filterScore}
              onChange={e => setFilterScore(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="ALL">All Match Scores</option>
              <option value="STRONG_APPLY">🔥 Strong Apply (90%+)</option>
              <option value="APPLY">⭐ Apply (80-89%)</option>
              <option value="REVIEW">🟡 Review (70-79%)</option>
              <option value="SKIP">🔴 Low / Skip (&lt;70%)</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="ALL">All Discovery Sources</option>
              <option value="gmail_alert">Gmail Alert Ingestion</option>
              <option value="direct_url">Direct URL Added</option>
              <option value="linkedin">LinkedIn Match</option>
            </select>
          </div>
        </div>

        {/* Quick Tech Tag Filters */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter Tech:
          </span>
          {tags.map(tag => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer font-medium ${
                  isSelected
                    ? 'bg-blue-600 text-white border border-blue-400'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {tag}
              </button>
            );
          })}
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-xs text-rose-400 hover:text-rose-300 ml-2 underline cursor-pointer"
            >
              Clear tag
            </button>
          )}
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No jobs match your filter</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Try adjusting your search query, score thresholds, or ingest a new job alert directly.
            </p>
          </div>
        ) : (
          filteredJobs.map(job => {
            const score = job.matchAnalysis?.overallScore || 70;
            const color = getScoreColor(score);
            const rec = getRecommendationBadge(job.matchAnalysis?.recommendation);
            const status = getStatusBadge(job.status);
            const isExpanded = expandedBreakdownId === job.id;
            const isAnalyzing = isAnalyzingId === job.id;

            return (
              <div
                key={job.id}
                className="bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all shadow-md space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  
                  {/* Left: Role Info */}
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-white tracking-tight">
                        {job.title}
                      </h2>
                      <span className="text-sm font-semibold text-slate-300">
                        @ {job.company}
                      </span>
                      <span className={`px-2 py-0.5 text-[11px] rounded border font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {job.source === 'gmail_alert' ? 'Gmail Alert' : job.source}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                      <span>{job.location} ({job.remoteType})</span>
                      <span>•</span>
                      <span className="text-emerald-300 font-mono font-medium">{job.salaryRange || 'Market Competitive'}</span>
                      <span>•</span>
                      <span>Exp: {job.experienceRequired}</span>
                      <span>•</span>
                      <span>Posted: {job.postedDate}</span>
                    </div>
                  </div>

                  {/* Right: Score Display & Primary Actions */}
                  <div className="flex items-center gap-3">
                    {/* Score Badge */}
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className={`px-3 py-1 rounded-xl font-bold font-mono text-xl border ${color.badge}`}>
                          {score}%
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {rec.label}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectJob(job)}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onReanalyzeJob(job)}
                        disabled={isAnalyzing}
                        title="Re-run AI Match Analysis"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin text-blue-400' : ''}`} />
                      </button>
                    </div>

                  </div>
                </div>

                {/* Match Analysis Chips & Summary */}
                {job.matchAnalysis && (
                  <div className="space-y-2 pt-1 border-t border-slate-800/80">
                    
                    {/* Why Match & Missing Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-300 mr-1">Match Highlights:</span>
                      {job.matchAnalysis.strongMatches.map((tech, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-[11px] rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>{tech}</span>
                        </span>
                      ))}

                      {job.matchAnalysis.missingSkills.map((miss, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-[11px] rounded bg-rose-950/40 text-rose-300 border border-rose-800/40 flex items-center gap-1"
                        >
                          <X className="w-3 h-3 text-rose-400" />
                          <span>Gap: {miss}</span>
                        </span>
                      ))}
                    </div>

                    {/* Reasoning Snippet */}
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/60">
                      <strong className="text-blue-400 font-semibold">AI Match Rationale: </strong>
                      {job.matchAnalysis.reasoning}
                    </p>
                  </div>
                )}

                {/* Expandable 7-Factor Score Breakdown */}
                {job.matchAnalysis && (
                  <div>
                    <button
                      onClick={() => setExpandedBreakdownId(isExpanded ? null : job.id)}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                      <span>{isExpanded ? 'Hide Hybrid Match Breakdown' : 'View 7-Factor Match Score Breakdown'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-1 border-b border-slate-800">
                          <span>Weighted Factor</span>
                          <span>Formula Weight</span>
                          <span>Score</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-400">
                              <span>Technical Skills (Jenkins, IaC, Linux)</span>
                              <span className="font-mono text-white">{job.matchAnalysis.technicalScore}% (35%)</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${job.matchAnalysis.technicalScore}%` }}></div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-400">
                              <span>Relevant Experience (TCS & Celebrare)</span>
                              <span className="font-mono text-white">{job.matchAnalysis.experienceScore}% (25%)</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${job.matchAnalysis.experienceScore}%` }}></div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-400">
                              <span>Cloud & Infrastructure (AWS, VPC, EKS)</span>
                              <span className="font-mono text-white">{job.matchAnalysis.cloudScore}% (15%)</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${job.matchAnalysis.cloudScore}%` }}></div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-400">
                              <span>CI/CD Automation (25+ Jenkins Pipelines)</span>
                              <span className="font-mono text-white">{job.matchAnalysis.cicdScore}% (10%)</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${job.matchAnalysis.cicdScore}%` }}></div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-400">
                              <span>Seniority & Scope (2.8 yrs DevOps)</span>
                              <span className="font-mono text-white">{job.matchAnalysis.seniorityScore}% (5%)</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${job.matchAnalysis.seniorityScore}%` }}></div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-slate-400">
                              <span>Certification (AWS SAA-C03 Verified)</span>
                              <span className="font-mono text-white">{job.matchAnalysis.certificationScore}% (5%)</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${job.matchAnalysis.certificationScore}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Controls: Status Dropdown & Prepared Artifact Indicators */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs">
                  
                  {/* Artifact Indicators */}
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="flex items-center gap-1">
                      <FileCheck2 className={`w-3.5 h-3.5 ${job.resumeVersion ? 'text-emerald-400' : 'text-slate-600'}`} />
                      <span className={job.resumeVersion ? 'text-slate-300' : 'text-slate-500'}>
                        {job.resumeVersion ? 'Resume Ready' : 'No Resume'}
                      </span>
                    </span>

                    <span className="flex items-center gap-1">
                      <Mail className={`w-3.5 h-3.5 ${job.coldEmail ? 'text-cyan-400' : 'text-slate-600'}`} />
                      <span className={job.coldEmail ? 'text-slate-300' : 'text-slate-500'}>
                        {job.coldEmail ? 'Cold Email Ready' : 'No Email'}
                      </span>
                    </span>

                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-slate-300">Guardrails OK</span>
                    </span>
                  </div>

                  {/* Status Picker & External Link */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Status:</span>
                    <select
                      value={job.status}
                      onChange={e => onUpdateJobStatus(job.id, e.target.value as JobStatus)}
                      className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
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

                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded hover:border-slate-700 transition-colors"
                      title="Open Original Job Posting"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {onDeleteJob && (
                      <button
                        onClick={() => onDeleteJob(job)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 bg-slate-950 border border-slate-800 rounded hover:border-rose-900/60 transition-colors cursor-pointer"
                        title="Delete from active jobs and move to 7-day SQLite backup bin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
