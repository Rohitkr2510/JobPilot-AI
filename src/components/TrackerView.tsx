import React, { useState } from 'react';
import { 
  Kanban, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ExternalLink, 
  Mail, 
  MessageSquare, 
  ChevronRight, 
  Plus, 
  FileText, 
  Building,
  Sparkles,
  Trash2,
  Archive
} from 'lucide-react';
import { JobOpportunity, JobStatus } from '../types';
import { getScoreColor, getStatusBadge, copyToClipboard } from '../utils/helpers';

interface TrackerViewProps {
  jobs: JobOpportunity[];
  onSelectJob: (job: JobOpportunity) => void;
  onUpdateJobStatus: (jobId: string, status: JobStatus) => void;
  onDeleteJob?: (job: JobOpportunity) => void;
  onOpenBackupBin?: () => void;
}

export const TrackerView: React.FC<TrackerViewProps> = ({
  jobs,
  onSelectJob,
  onUpdateJobStatus,
  onDeleteJob,
  onOpenBackupBin,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [followUpModalJob, setFollowUpModalJob] = useState<JobOpportunity | null>(null);
  const [followUpCopied, setFollowUpCopied] = useState(false);

  // Group columns for Kanban
  const columns: { status: JobStatus; title: string; color: string }[] = [
    { status: 'RECOMMENDED', title: 'Recommended', color: 'border-cyan-500/40 bg-cyan-500/5' },
    { status: 'READY_TO_APPLY', title: 'Ready to Apply', color: 'border-amber-500/40 bg-amber-500/5' },
    { status: 'APPLIED', title: 'Applied', color: 'border-blue-500/40 bg-blue-500/5' },
    { status: 'SCREENING', title: 'Screening', color: 'border-teal-500/40 bg-teal-500/5' },
    { status: 'INTERVIEW', title: 'Interviewing', color: 'border-purple-500/40 bg-purple-500/5' },
    { status: 'OFFER', title: 'Offer 🎉', color: 'border-emerald-500/40 bg-emerald-500/5' }
  ];

  // Detect follow-ups due (> 24 hours in active demo, or status is APPLIED with appliedDate)
  const appliedJobs = jobs.filter(j => j.status === 'APPLIED');

  return (
    <div className="space-y-6">
      
      {/* Top Header & Mode Toggle */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Kanban className="w-5 h-5 text-blue-400" />
            <span>DevOps Application Lifecycle Tracker</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full stage progression from Discovery through Screening, Interview, and Offer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenBackupBin && (
            <button
              onClick={onOpenBackupBin}
              className="px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Archive className="w-3.5 h-3.5 text-amber-400" />
              <span>Backup Bin (7-Day)</span>
            </button>
          )}

          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Table View
            </button>
          </div>
        </div>
      </div>

      {/* Follow-up Reminder Notice Banner */}
      {appliedJobs.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Follow-Up Agent Alert
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                You have active applications submitted (e.g. <strong>{appliedJobs[0].company}</strong>). A polite follow-up increases recruiter response rate by 24%.
              </p>
            </div>
          </div>

          <button
            onClick={() => setFollowUpModalJob(appliedJobs[0])}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Generate Follow-up Email</span>
          </button>
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {columns.map(col => {
            const colJobs = jobs.filter(j => j.status === col.status);
            return (
              <div
                key={col.status}
                className={`rounded-xl border p-3 flex flex-col h-full min-h-[450px] ${col.color}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {col.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-800">
                    {colJobs.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1">
                  {colJobs.map(job => {
                    const score = job.matchAnalysis?.overallScore || 70;
                    const color = getScoreColor(score);

                    return (
                      <div
                        key={job.id}
                        className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-2.5 transition-all shadow-md group cursor-pointer"
                        onClick={() => onSelectJob(job)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                              {job.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-medium line-clamp-1">
                              {job.company}
                            </p>
                          </div>
                          <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] border ${color.badge}`}>
                            {score}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                          <span>{job.location}</span>
                          <span className="font-mono text-emerald-400">
                            {job.appliedDate ? `Applied: ${job.appliedDate}` : job.remoteType}
                          </span>
                        </div>

                        {/* Quick Advancement Selector */}
                        <div
                          className="pt-2 flex items-center justify-between gap-1 text-[10px]"
                          onClick={e => e.stopPropagation()}
                        >
                          <span className="text-slate-500 text-[9px] uppercase font-bold">Move:</span>
                          <select
                            value={job.status}
                            onChange={e => onUpdateJobStatus(job.id, e.target.value as JobStatus)}
                            className="w-full px-1.5 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="RECOMMENDED">Recommended</option>
                            <option value="READY_TO_APPLY">Ready to Apply</option>
                            <option value="APPLIED">Applied</option>
                            <option value="SCREENING">Screening</option>
                            <option value="INTERVIEW">Interview</option>
                            <option value="OFFER">Offer</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                          {onDeleteJob && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                onDeleteJob(job);
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 bg-slate-950 border border-slate-800 rounded hover:border-rose-900/60 transition-colors cursor-pointer"
                              title="Delete and move to 7-day SQLite backup bin"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {colJobs.length === 0 && (
                    <div className="h-24 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-[11px] text-slate-600 font-medium">
                      Empty stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Company & Role</th>
                <th className="py-3.5 px-4">Match %</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Timeline</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {jobs.map(job => {
                const score = job.matchAnalysis?.overallScore || 70;
                const color = getScoreColor(score);
                const status = getStatusBadge(job.status);

                return (
                  <tr key={job.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{job.title}</div>
                      <div className="text-slate-400 text-[11px]">{job.company}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded text-[11px] border ${color.badge}`}>
                        {score}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{job.location}</div>
                      <div className="text-[10px] text-slate-500">{job.remoteType}</div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={job.status}
                        onChange={e => onUpdateJobStatus(job.id, e.target.value as JobStatus)}
                        className={`px-2 py-1 rounded text-xs border font-medium bg-slate-950 cursor-pointer ${status.color}`}
                      >
                        <option value="DISCOVERED">Discovered</option>
                        <option value="RECOMMENDED">Recommended</option>
                        <option value="READY_TO_APPLY">Ready to Apply</option>
                        <option value="APPLIED">Applied</option>
                        <option value="SCREENING">Screening</option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="OFFER">Offer</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400 font-mono">
                      {job.appliedDate ? `Applied: ${job.appliedDate}` : `Posted: ${job.postedDate}`}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectJob(job)}
                          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Workspace
                        </button>
                        {onDeleteJob && (
                          <button
                            onClick={() => onDeleteJob(job)}
                            className="p-1 text-slate-500 hover:text-rose-400 bg-slate-950 border border-slate-800 rounded hover:border-rose-900/60 transition-colors cursor-pointer"
                            title="Delete and move to 7-day SQLite backup bin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Follow-up Cold Email Modal */}
      {followUpModalJob && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>Follow-Up Email Draft: {followUpModalJob.company}</span>
              </h3>
              <button
                onClick={() => setFollowUpModalJob(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Subject:</span>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-white">
                Following up on {followUpModalJob.title} Application — Rohit Kumar Mahato
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold">Email Body:</span>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-all font-sans">
                {`Hi ${followUpModalJob.company} Recruiting Team,\n\nI hope you are having a productive week. I am following up on my application submitted for the ${followUpModalJob.title} position.\n\nI remain very enthusiastic about the chance to bring my experience automating 25+ Jenkins pipelines, codifying AWS infrastructure with Terraform, and cutting release cycles by 40% to your team.\n\nPlease let me know if any additional information or technical portfolios would be helpful for the hiring squad.\n\nThank you for your time,\nRohit Kumar Mahato\nrs6578264@gmail.com | +91 98765 43210`}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setFollowUpModalJob(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  const text = `Subject: Following up on ${followUpModalJob.title} Application — Rohit Kumar Mahato\n\nHi ${followUpModalJob.company} Recruiting Team,\n\nI hope you are having a productive week. I am following up on my application submitted for the ${followUpModalJob.title} position.\n\nI remain very enthusiastic about the chance to bring my experience automating 25+ Jenkins pipelines, codifying AWS infrastructure with Terraform, and cutting release cycles by 40% to your team.\n\nPlease let me know if any additional information or technical portfolios would be helpful for the hiring squad.\n\nThank you for your time,\nRohit Kumar Mahato\nrs6578264@gmail.com | +91 98765 43210`;
                  await copyToClipboard(text);
                  setFollowUpCopied(true);
                  setTimeout(() => setFollowUpCopied(false), 2000);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded flex items-center gap-1.5"
              >
                {followUpCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                <span>{followUpCopied ? 'Copied to Clipboard!' : 'Copy Email Text'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
