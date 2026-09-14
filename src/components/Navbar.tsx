import React from 'react';
import { 
  Bot, 
  Terminal, 
  Briefcase, 
  FileText, 
  UserCheck, 
  Kanban, 
  BarChart3, 
  PlusCircle, 
  ShieldCheck, 
  Sparkles,
  Inbox,
  Mail,
  Upload,
  Database,
  Archive
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab?: (tab: string) => void;
  onTabChange?: (tab: string) => void;
  onOpenIngestModal: () => void;
  onOpenGmailSync?: () => void;
  onOpenResumeUpload?: () => void;
  onOpenSqliteDaily?: () => void;
  onOpenBackupBin?: () => void;
  jobsCount?: number;
  strongMatchesCount?: number;
  followUpsCount?: number;
  isGmailLinked?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onTabChange,
  onOpenIngestModal,
  onOpenGmailSync,
  onOpenResumeUpload,
  onOpenSqliteDaily,
  onOpenBackupBin,
  jobsCount = 0,
  strongMatchesCount = 0,
  followUpsCount = 0,
  isGmailLinked = false
}) => {
  const handleNav = (tab: string) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tab);
    }
    if (typeof onTabChange === 'function') {
      onTabChange(tab);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold border border-blue-400/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
                  JobPilot AI
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-blue-950 text-blue-300 border border-blue-800">
                  DevOps Edition
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <span>Rohit Kumar Mahato</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-mono">TCS (DevOps) | AWS SAA</span>
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => handleNav('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Command Center</span>
            </button>

            <button
              onClick={() => handleNav('jobs')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative cursor-pointer ${
                activeTab === 'jobs'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Job Queue</span>
              {jobsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {jobsCount}
                </span>
              )}
              {strongMatchesCount > 0 && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => handleNav('workspace')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'workspace'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Application Workspace</span>
            </button>

            <button
              onClick={() => handleNav('tracker')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative cursor-pointer ${
                activeTab === 'tracker'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>Tracker</span>
              {followUpsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {followUpsCount} due
                </span>
              )}
            </button>

            <button
              onClick={() => handleNav('profile')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Profile & Resume</span>
            </button>

            <button
              onClick={() => handleNav('analytics')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          </nav>

          {/* Action Toolbar: Gmail Sync, Resume Upload, SQLite Daily, Ingest */}
          <div className="flex items-center gap-2">
            
            {/* SQLite Persistent Badge / Daily Modal Button */}
            {onOpenSqliteDaily && (
              <button
                onClick={onOpenSqliteDaily}
                title="SQLite Local Database & Daily Routine"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">SQLite</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </button>
            )}

            {/* Backup Bin Button */}
            {onOpenBackupBin && (
              <button
                onClick={onOpenBackupBin}
                title="Open 7-Day Backup Bin & Restore Center"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-amber-950/40 text-amber-300 border border-slate-700 hover:border-amber-700/60 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5 text-amber-400" />
                <span>Backup Bin</span>
              </button>
            )}

            {/* Gmail Sync Button */}
            {onOpenGmailSync && (
              <button
                onClick={onOpenGmailSync}
                title="Link Gmail & Sync Job Alerts"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Gmail Alerts</span>
                {isGmailLinked && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              </button>
            )}

            {/* Upload Recent Resume Button */}
            {onOpenResumeUpload && (
              <button
                onClick={onOpenResumeUpload}
                title="Upload & Parse Recent Resume to Update App Content"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Upload Resume</span>
              </button>
            )}

            {/* Ingest Job Modal Button */}
            <button
              onClick={onOpenIngestModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 border border-blue-400/40 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Inbox className="w-3.5 h-3.5 text-cyan-200" />
              <span className="hidden md:inline">Ingest Job</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-slate-900 no-scrollbar">
          {[
            { id: 'dashboard', label: 'Center' },
            { id: 'jobs', label: 'Jobs' },
            { id: 'workspace', label: 'Workspace' },
            { id: 'tracker', label: 'Tracker' },
            { id: 'profile', label: 'Resume & Profile' },
            { id: 'analytics', label: 'Analytics' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleNav(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
