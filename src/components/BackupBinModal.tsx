import React, { useState, useEffect } from 'react';
import {
  Trash2,
  RotateCcw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  X,
  Archive,
  Database,
  Search,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { BackupJob, JobOpportunity } from '../types';

interface BackupBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobRestored: (job: JobOpportunity) => void;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const BackupBinModal: React.FC<BackupBinModalProps> = ({
  isOpen,
  onClose,
  onJobRestored,
  onToast,
}) => {
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmEmptyAll, setConfirmEmptyAll] = useState(false);
  const [isEmptyingAll, setIsEmptyingAll] = useState(false);
  const [isCleaningExpired, setIsCleaningExpired] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBackupJobs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/backup/jobs');
      const data = await res.json();
      if (data.success && Array.isArray(data.backupJobs)) {
        setBackupJobs(data.backupJobs);
      }
    } catch (err: any) {
      onToast(err.message || 'Failed to load backup bin', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBackupJobs();
      setConfirmDeleteId(null);
      setConfirmEmptyAll(false);
    }
  }, [isOpen]);

  const handleRestore = async (backupItem: BackupJob) => {
    setRestoringId(backupItem.id);
    try {
      const res = await fetch(`/api/backup/restore/${backupItem.id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.job) {
        setBackupJobs(prev => prev.filter(b => b.id !== backupItem.id));
        onJobRestored(data.job);
        onToast(`Restored "${backupItem.title} @ ${backupItem.company}" back to active opportunities!`, 'success');
      } else {
        throw new Error(data.error || 'Failed to restore job');
      }
    } catch (err: any) {
      onToast(err.message || 'Error restoring job from backup', 'error');
    } finally {
      setRestoringId(null);
    }
  };

  const handleExecutePermanentDelete = async (backupItem: BackupJob) => {
    setDeletingId(backupItem.id);
    try {
      let res = await fetch(`/api/backup/permanent/${backupItem.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        // Fallback to POST
        res = await fetch(`/api/backup/permanent/${backupItem.id}`, {
          method: 'POST',
        });
      }
      const data = await res.json();
      if (data.success) {
        setBackupJobs(prev => prev.filter(b => b.id !== backupItem.id));
        setConfirmDeleteId(null);
        onToast(`Permanently removed "${backupItem.company} - ${backupItem.title}"`, 'info');
      } else {
        throw new Error(data.error || 'Failed to permanently delete');
      }
    } catch (err: any) {
      onToast(err.message || 'Error deleting from backup', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExecuteEmptyBin = async () => {
    setIsEmptyingAll(true);
    try {
      let res = await fetch('/api/backup/all', {
        method: 'DELETE',
      });
      if (!res.ok) {
        res = await fetch('/api/backup/empty', {
          method: 'POST',
        });
      }
      const data = await res.json();
      if (data.success) {
        setBackupJobs([]);
        setConfirmEmptyAll(false);
        onToast(`Recycle bin emptied successfully (${data.count || 0} jobs removed)`, 'success');
      } else {
        throw new Error(data.error || 'Failed to empty recycle bin');
      }
    } catch (err: any) {
      onToast(err.message || 'Error emptying recycle bin', 'error');
    } finally {
      setIsEmptyingAll(false);
    }
  };

  const handleCleanupExpired = async () => {
    setIsCleaningExpired(true);
    try {
      const res = await fetch('/api/backup/cleanup', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        await fetchBackupJobs();
        onToast(data.message || `Cleaned up expired jobs`, 'info');
      }
    } catch (err: any) {
      onToast(err.message || 'Error cleaning expired jobs', 'error');
    } finally {
      setIsCleaningExpired(false);
    }
  };

  const filteredBackups = backupJobs.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.company.toLowerCase().includes(q) ||
      b.title.toLowerCase().includes(q) ||
      b.location.toLowerCase().includes(q)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  SQLite 7-Day Recycle & Backup Bin
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                  {backupJobs.length} {backupJobs.length === 1 ? 'Job' : 'Jobs'} in Bin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Jobs deleted from the main SQLite table are safely preserved here for 7 days before purge.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBackupJobs}
              disabled={isLoading}
              title="Refresh backup records"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7-Day Retention Notice Banner + Top Actions */}
        <div className="px-5 py-3 bg-amber-950/20 border-b border-amber-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200/90">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Safe 7-Day Recovery:</strong> Delete with confidence. Restore anytime or permanently delete items below.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Empty Entire Bin button with inline confirmation */}
            {backupJobs.length > 0 && (
              <>
                {confirmEmptyAll ? (
                  <div className="flex items-center gap-1.5 bg-rose-950 border border-rose-800 px-2 py-1 rounded-lg">
                    <span className="text-[11px] font-bold text-rose-300">Empty all {backupJobs.length}?</span>
                    <button
                      onClick={handleExecuteEmptyBin}
                      disabled={isEmptyingAll}
                      className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                    >
                      {isEmptyingAll ? 'Emptying...' : 'Yes, Empty All'}
                    </button>
                    <button
                      onClick={() => setConfirmEmptyAll(false)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmEmptyAll(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-800/60 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Empty Bin</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={handleCleanupExpired}
              disabled={isCleaningExpired}
              title="Purge expired items (> 7 days)"
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isCleaningExpired ? 'animate-spin text-amber-400' : ''}`} />
              <span>Purge Expired</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter recycle bin by company, role, or location..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-2.5 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Backup Jobs List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
              <p className="text-xs">Loading SQLite recycle bin...</p>
            </div>
          ) : filteredBackups.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <Archive className="w-10 h-10 mx-auto text-slate-700" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-300">
                  {searchQuery ? 'No matching items in recycle bin' : 'Recycle Bin is Empty'}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? 'Try adjusting your search query.'
                    : 'Whenever you delete an opportunity from Jobs Explorer, Tracker, or Workspace, it is preserved here for 7 days with 1-click restore.'}
                </p>
              </div>
            </div>
          ) : (
            filteredBackups.map(backup => {
              const isRestoring = restoringId === backup.id;
              const isDeleting = deletingId === backup.id;
              const isConfirmingDelete = confirmDeleteId === backup.id;
              const isUrgent = backup.daysRemaining <= 1;

              return (
                <div
                  key={backup.id}
                  className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  {/* Left Role Info */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-white truncate">
                        {backup.title}
                      </h3>
                      <span className="text-xs font-semibold text-slate-300">
                        @ {backup.company}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">
                        {backup.overallScore}% Match
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span>{backup.location || 'Remote'}</span>
                      <span>•</span>
                      <span>{backup.remoteType}</span>
                      <span>•</span>
                      <span>Deleted: {new Date(backup.deletedAt).toLocaleDateString()}</span>
                    </div>

                    {/* Expiration Tag */}
                    <div className="pt-1 flex items-center gap-2 text-xs">
                      <span className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded border ${
                        isUrgent
                          ? 'bg-rose-950/40 text-rose-400 border-rose-800/60'
                          : 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>
                          {backup.daysRemaining > 0 
                            ? `${backup.daysRemaining} days remaining` 
                            : `${backup.hoursRemaining} hours remaining`}
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Auto-purges: {new Date(backup.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Right Actions: Restore & Permanent Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRestore(backup)}
                      disabled={isRestoring || isDeleting}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                      <span>{isRestoring ? 'Restoring...' : 'Restore to Active'}</span>
                    </button>

                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-800/80 px-2.5 py-1.5 rounded-xl animate-in fade-in">
                        <span className="text-[11px] font-bold text-rose-300">Delete forever?</span>
                        <button
                          onClick={() => handleExecutePermanentDelete(backup)}
                          disabled={isDeleting}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                        >
                          {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(backup.id)}
                        disabled={isRestoring || isDeleting}
                        title="Delete permanently from recycle bin now"
                        className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/60 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>SQLite Table: <code>jobs_backup</code> • Auto-purged after 7 days</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
