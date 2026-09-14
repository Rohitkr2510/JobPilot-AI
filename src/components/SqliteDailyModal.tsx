import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  CheckCircle2,
  Calendar,
  Terminal,
  Clock,
  ArrowRight,
  ShieldCheck,
  X,
  RefreshCw,
  Sparkles,
  Briefcase,
  Archive
} from 'lucide-react';
import { JobOpportunity } from '../types';

interface SqliteDailyModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobOpportunity[];
  onOpenGmailSync: () => void;
  onOpenResumeUpload: () => void;
  onOpenBackupBin?: () => void;
}

export const SqliteDailyModal: React.FC<SqliteDailyModalProps> = ({
  isOpen,
  onClose,
  jobs,
  onOpenGmailSync,
  onOpenResumeUpload,
  onOpenBackupBin,
}) => {
  const [dbStats, setDbStats] = useState<{
    dbPath: string;
    totalJobs: number;
    backupJobsCount?: number;
    appliedCount: number;
    interviewCount: number;
    recommendedCount: number;
    lastSyncDate: string | null;
    fileSizeBytes: number;
  } | null>(null);

  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Daily checklist state stored in localStorage for today
  const todayKey = `jobpilot_checklist_${new Date().toISOString().split('T')[0]}`;
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    sync_gmail: false,
    review_top_jobs: false,
    generate_resume: false,
    submit_application: false,
    cold_outreach: false,
  });

  useEffect(() => {
    if (!isOpen) return;

    // Load saved checklist for today
    const savedChecklist = localStorage.getItem(todayKey);
    if (savedChecklist) {
      try {
        setChecklist(JSON.parse(savedChecklist));
      } catch {}
    }

    // Fetch DB stats from server
    setIsLoadingStats(true);
    fetch('/api/db/stats')
      .then(res => res.json())
      .then(data => {
        if (data.stats) setDbStats(data.stats);
      })
      .catch(() => {})
      .finally(() => setIsLoadingStats(false));
  }, [isOpen]);

  const toggleChecklistItem = (key: string) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);
    localStorage.setItem(todayKey, JSON.stringify(updated));
  };

  const handleDownloadDb = () => {
    window.location.href = '/api/db/download';
  };

  if (!isOpen) return null;

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const appliedTodayCount = jobs.filter(
    j => j.status === 'APPLIED' && j.appliedDate === new Date().toISOString().split('T')[0]
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Local SQLite & Daily Job Assistant
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Persistent Storage
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                100% locally stored in SQLite for daily offline execution and persistent application tracking.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* SQLite Database Telemetry Card */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-white">data/jobpilot.db</span>
                <span className="text-[11px] text-slate-500">
                  ({Math.round((dbStats?.fileSizeBytes || 61440) / 1024)} KB)
                </span>
              </div>
              <button
                onClick={handleDownloadDb}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                Download .db Backup
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-500 block text-[11px]">Total Opportunities</span>
                <span className="text-base font-bold text-white">{dbStats?.totalJobs || jobs.length}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-500 block text-[11px]">Top Recommendations</span>
                <span className="text-base font-bold text-emerald-400">
                  {jobs.filter(j => (j.matchAnalysis?.overallScore || 0) >= 85).length}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-500 block text-[11px]">Applications Sent</span>
                <span className="text-base font-bold text-blue-400">
                  {jobs.filter(j => j.status === 'APPLIED').length}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-500 block text-[11px]">Applied Today</span>
                <span className="text-base font-bold text-amber-400">{appliedTodayCount}</span>
              </div>
              <div
                onClick={() => onOpenBackupBin?.()}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  onOpenBackupBin
                    ? 'bg-amber-950/20 border-amber-800/40 hover:border-amber-600 cursor-pointer'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <span className="text-amber-400/90 block text-[11px]">In 7-Day Backup</span>
                <span className="text-base font-bold text-amber-300">
                  {dbStats?.backupJobsCount ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Job Application Routine */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Today's Daily Application Checklist ({completedCount}/5 Complete)
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="space-y-2">
              {[
                {
                  id: 'sync_gmail',
                  title: '1. Sync Gmail for fresh job alerts',
                  desc: 'Scan inbox for recent LinkedIn, Indeed, and recruiter notifications.',
                  actionLabel: 'Open Gmail Sync',
                  onAction: onOpenGmailSync,
                },
                {
                  id: 'review_top_jobs',
                  title: '2. Review high-scoring DevOps opportunities (>= 90%)',
                  desc: 'Evaluate requirements against your AWS, Jenkins, and Kubernetes experience.',
                },
                {
                  id: 'generate_resume',
                  title: '3. Generate & Download 1-Page Tailored ATS Resume',
                  desc: 'Use the PDF or TXT export in Application Workspace to download tailored resume.',
                },
                {
                  id: 'submit_application',
                  title: '4. Apply & Mark as "APPLIED" in SQLite Tracker',
                  desc: 'Update status so the follow-up reminder and interview tracker trigger.',
                },
                {
                  id: 'cold_outreach',
                  title: '5. Send Tailored Cold Outreach to Recruiter',
                  desc: 'Copy the AI cold email draft to reach hiring managers directly.',
                },
              ].map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                    checklist[item.id]
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-300'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checklist[item.id] || false}
                      onChange={() => {}}
                      className="mt-1 h-4 w-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <p className={`text-xs font-semibold ${checklist[item.id] ? 'line-through text-slate-400' : 'text-white'}`}>
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                  </div>

                  {item.actionLabel && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        item.onAction?.();
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium whitespace-nowrap cursor-pointer"
                    >
                      {item.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Local Run Instructions */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              How to Run This App Locally Every Day
            </h4>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 space-y-1 select-all">
              <p>git clone &lt;your-repo&gt;</p>
              <p>npm install</p>
              <p>npm run dev</p>
            </div>
            <p className="text-[11px] text-slate-400">
              All jobs, generated resumes, and custom answers persist in the SQLite file at <code className="text-slate-200">data/jobpilot.db</code> so you can pick up where you left off every morning.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onOpenResumeUpload}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Upload Recent Resume
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
