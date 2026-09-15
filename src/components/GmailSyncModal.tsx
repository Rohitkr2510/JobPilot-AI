import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ExternalLink, 
  X, 
  Clock, 
  Search,
  Shield,
  Layers,
  Inbox,
  Calendar,
  CalendarDays,
  Filter,
  Sliders,
  Check
} from 'lucide-react';
import { JobOpportunity } from '../types';

interface GmailSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobsImported: (jobs: JobOpportunity[]) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

type TimeRangeType = '24h' | '3d' | '7d' | '14d' | '30d' | 'custom' | 'all';

interface TimeRangePreset {
  id: TimeRangeType;
  label: string;
  sublabel: string;
  gmailFilter: string;
}

const TIME_RANGE_PRESETS: TimeRangePreset[] = [
  { id: '24h', label: 'Last 24 Hours', sublabel: '1 Day', gmailFilter: 'newer_than:1d' },
  { id: '3d', label: 'Last 3 Days', sublabel: '72h', gmailFilter: 'newer_than:3d' },
  { id: '7d', label: 'Last 1 Week', sublabel: '7 Days', gmailFilter: 'newer_than:7d' },
  { id: '14d', label: 'Last 2 Weeks', sublabel: '14 Days', gmailFilter: 'newer_than:14d' },
  { id: '30d', label: 'Last 1 Month', sublabel: '30 Days', gmailFilter: 'newer_than:1m' },
  { id: 'custom', label: 'Custom Range', sublabel: 'Start - End', gmailFilter: 'after: & before:' },
  { id: 'all', label: 'All Time', sublabel: 'Unfiltered', gmailFilter: 'No date limit' },
];

interface ScanProgressState {
  percent: number;
  step: string;
  message: string;
  current: number;
  total: number;
  importedCount: number;
  duplicatesCount: number;
}

export const GmailSyncModal: React.FC<GmailSyncModalProps> = ({
  isOpen,
  onClose,
  onJobsImported,
  onToast,
}) => {
  const [isLinked, setIsLinked] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('rs6578264@gmail.com');
  const [searchQuery, setSearchQuery] = useState<string>(
    '("job alert" OR "jobs for you" OR "devops" OR "cloud engineer" OR "site reliability" OR "sre" OR "applied")'
  );
  
  // Date range state
  const [timeRange, setTimeRange] = useState<TimeRangeType>('7d');
  
  // Custom date range state (defaults to past 7 days to today)
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultStartStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(defaultStartStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const [maxResults, setMaxResults] = useState<number>(15);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<ScanProgressState | null>(null);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [syncResult, setSyncResult] = useState<{
    emailsScanned: number;
    syncedCount: number;
    duplicatesSkipped?: number;
    jobs: JobOpportunity[];
    isSimulation?: boolean;
    timeRange?: string;
    rangeLabel?: string;
    effectiveQuery?: string;
  } | null>(null);
  const [clientId, setClientId] = useState<string>('');

  useEffect(() => {
    // Load cached token if available
    const savedToken = localStorage.getItem('jobpilot_gmail_token');
    const savedEmail = localStorage.getItem('jobpilot_gmail_email');
    if (savedToken) {
      setAccessToken(savedToken);
      setIsLinked(true);
    }
    if (savedEmail) {
      setUserEmail(savedEmail);
    }

    // Fetch OAuth client ID from server
    fetch('/api/oauth-config')
      .then(res => res.json())
      .then(data => {
        if (data.clientId) {
          setClientId(data.clientId);
        }
      })
      .catch(() => {});

    // Fetch sync history from SQLite
    fetch('/api/gmail/history')
      .then(res => res.json())
      .then(data => {
        if (data.history) {
          setSyncHistory(data.history);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate the effective Gmail query preview live
  const getEffectiveQueryPreview = () => {
    let dateFilter = '';
    if (timeRange === '24h') dateFilter = 'newer_than:1d';
    else if (timeRange === '3d') dateFilter = 'newer_than:3d';
    else if (timeRange === '7d') dateFilter = 'newer_than:7d';
    else if (timeRange === '14d') dateFilter = 'newer_than:14d';
    else if (timeRange === '30d') dateFilter = 'newer_than:1m';
    else if (timeRange === 'custom') {
      const parts = [];
      if (startDate) parts.push(`after:${startDate.replace(/-/g, '/')}`);
      if (endDate) parts.push(`before:${endDate.replace(/-/g, '/')}`);
      dateFilter = parts.join(' ');
    }

    const base = searchQuery.trim();
    if (dateFilter && !base.includes('newer_than:') && !base.includes('after:') && !base.includes('before:')) {
      return `${base} ${dateFilter}`;
    }
    return base;
  };

  // Quick custom date helpers
  const handleSetQuickCustom = (days: number) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
    setTimeRange('custom');
  };

  // Handle Google OAuth Link via Google Identity Services
  const handleLinkGmail = () => {
    if (!window.google?.accounts?.oauth2) {
      onToast('Google Identity Services client is initializing. Please wait a moment.', 'info');
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId || '192992717479-ocaonobk699q4r97dsh8fqgj10dg0n7p.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/gmail.readonly',
        callback: (response: any) => {
          if (response.error) {
            onToast(`Gmail OAuth link failed: ${response.error}`, 'error');
            return;
          }
          if (response.access_token) {
            setAccessToken(response.access_token);
            setIsLinked(true);
            localStorage.setItem('jobpilot_gmail_token', response.access_token);
            onToast('Gmail successfully linked to JobPilot AI!', 'success');
          }
        },
      });

      client.requestAccessToken();
    } catch (err: any) {
      onToast(`OAuth error: ${err.message}`, 'error');
    }
  };

  const handleUnlink = () => {
    setAccessToken(null);
    setIsLinked(false);
    localStorage.removeItem('jobpilot_gmail_token');
    onToast('Gmail disconnected.', 'info');
  };

  // Perform Sync with Real-Time Streaming Progress
  const handleSyncAlerts = async (isSimulation = false) => {
    // Validate custom dates if selected
    if (timeRange === 'custom' && startDate && endDate && startDate > endDate) {
      onToast('Start date must be before or equal to End date', 'error');
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);
    setScanProgress({
      percent: 5,
      step: 'init',
      message: isSimulation ? 'Initializing simulated inbox scan...' : 'Connecting to Gmail & applying filters...',
      current: 0,
      total: 0,
      importedCount: 0,
      duplicatesCount: 0,
    });

    try {
      const res = await fetch('/api/gmail/sync-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: accessToken || '',
          query: searchQuery,
          timeRange,
          startDate: timeRange === 'custom' ? startDate : undefined,
          endDate: timeRange === 'custom' ? endDate : undefined,
          maxResults,
          isSimulation,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 401 || errText.includes('401')) {
          handleUnlink();
          throw new Error('Gmail token expired. Please link your Gmail account again.');
        }
        throw new Error(`Sync failed (${res.status}): ${errText}`);
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let finalData: any = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const event = JSON.parse(trimmed);
              if (event.type === 'progress') {
                setScanProgress({
                  percent: Math.min(99, Math.max(5, event.percent || 0)),
                  step: event.step || 'scanning',
                  message: event.message || 'Scanning...',
                  current: event.current || 0,
                  total: event.total || 0,
                  importedCount: event.importedCount || 0,
                  duplicatesCount: event.duplicatesCount || 0,
                });
              } else if (event.type === 'complete') {
                finalData = event;
                setScanProgress({
                  percent: 100,
                  step: 'complete',
                  message: event.message || 'Scan completed!',
                  current: event.emailsScanned || 0,
                  total: event.emailsScanned || 0,
                  importedCount: event.syncedCount || 0,
                  duplicatesCount: event.duplicatesSkipped || 0,
                });
              } else if (event.type === 'error') {
                throw new Error(event.error || 'Sync error occurred');
              }
            } catch (jsonErr: any) {
              if (jsonErr.message?.includes('Gmail token') || jsonErr.message?.includes('Sync error')) {
                throw jsonErr;
              }
            }
          }
        }

        if (finalData) {
          setSyncResult(finalData);

          if (finalData.jobs && finalData.jobs.length > 0) {
            onJobsImported(finalData.jobs);
            const dupText = finalData.duplicatesSkipped ? ` (${finalData.duplicatesSkipped} duplicate alerts skipped)` : '';
            onToast(
              `Imported ${finalData.jobs.length} unique DevOps job alert${finalData.jobs.length > 1 ? 's' : ''} for ${finalData.rangeLabel || timeRange}${dupText}!`,
              'success'
            );
          } else {
            const dupText = finalData.duplicatesSkipped ? ` (${finalData.duplicatesSkipped} duplicates skipped / already present)` : '';
            onToast(`Scanned ${finalData.emailsScanned} emails in ${finalData.rangeLabel || timeRange}. All entries are unique / up to date${dupText}.`, 'info');
          }

          // Refresh sync history
          const histRes = await fetch('/api/gmail/history');
          const histData = await histRes.json();
          if (histData.history) setSyncHistory(histData.history);
          return;
        }
      }

      // Fallback if stream was empty or unparsed
      const fallbackRes = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: accessToken || '',
          query: searchQuery,
          timeRange,
          startDate: timeRange === 'custom' ? startDate : undefined,
          endDate: timeRange === 'custom' ? endDate : undefined,
          maxResults,
          isSimulation,
        }),
      });
      const data = await fallbackRes.json();
      setSyncResult(data);
      if (data.jobs && data.jobs.length > 0) {
        onJobsImported(data.jobs);
      }
    } catch (err: any) {
      onToast(err.message || 'Error syncing Gmail alerts', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Gmail Job Alerts Reader
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  OAuth 2.0
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Scan your linked Gmail inbox for DevOps job alerts across customizable time ranges.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Account Connection Status */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isLinked ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <div>
                <p className="text-sm font-semibold text-white">
                  {isLinked ? 'Gmail Account Linked' : 'Gmail Not Connected'}
                </p>
                <p className="text-xs text-slate-400">
                  {isLinked
                    ? `Authorized for: ${userEmail} (read-only access)`
                    : 'Link your Google account to read job alert emails'}
                </p>
              </div>
            </div>

            {isLinked ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-mono bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </span>
                <button
                  onClick={handleUnlink}
                  className="text-xs text-slate-400 hover:text-rose-400 px-2.5 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Unlink
                </button>
              </div>
            ) : (
              <button
                onClick={handleLinkGmail}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-red-600/20 border border-red-400/40 transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                Link Gmail Account
              </button>
            )}
          </div>

          {/* Localhost OAuth Hint Banner */}
          {!isLinked && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-blue-300">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Running JobPilot AI Locally on Localhost</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Google blocks OAuth on <code className="text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">http://localhost:3000</code> with <span className="text-amber-400 font-mono">origin_mismatch</span> because the default client ID is registered for cloud deployment.
              </p>
              <div className="pt-1 text-slate-300 text-[11px] space-y-1">
                <p>
                  ⚡ <strong>Recommended:</strong> Use the <span className="text-cyan-300 font-semibold">"Test Range Simulation"</span> button below to test DevOps job alert ingestion and Gemini AI parsing with zero setup.
                </p>
                <p className="text-slate-400 text-[10px]">
                  🔑 <strong>To link your live Gmail:</strong> Create an OAuth Client ID in Google Cloud Console with <code className="text-slate-300">http://localhost:3000</code> as an Authorized JavaScript Origin, and set <code className="text-cyan-300 font-mono">GOOGLE_CLIENT_ID</code> in your <code className="text-slate-300">.env</code>.
                </p>
              </div>
            </div>
          )}

          {/* Time Range Selector */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Email Scan Date & Time Range
              </label>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                {timeRange === 'custom'
                  ? `${startDate} → ${endDate}`
                  : TIME_RANGE_PRESETS.find(p => p.id === timeRange)?.gmailFilter}
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIME_RANGE_PRESETS.map(preset => {
                const isActive = timeRange === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setTimeRange(preset.id)}
                    className={`px-3 py-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{preset.label}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                      {preset.sublabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Date Range Picker (Shown when Custom Range is active) */}
            {timeRange === 'custom' && (
              <div className="p-3.5 mt-2 rounded-xl bg-slate-900 border border-slate-700/80 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
                    Specify Exact Calendar Date Range
                  </span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      onClick={() => handleSetQuickCustom(1)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      Past 24h
                    </button>
                    <button
                      onClick={() => handleSetQuickCustom(3)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      Past 3d
                    </button>
                    <button
                      onClick={() => handleSetQuickCustom(7)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      Past 7d
                    </button>
                    <button
                      onClick={() => handleSetQuickCustom(30)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      Past 30d
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Start Date (From)</label>
                    <input
                      type="date"
                      value={startDate}
                      max={endDate || todayStr}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">End Date (To)</label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      max={todayStr}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  Gmail query parameter generated: <code className="text-cyan-300">after:{startDate.replace(/-/g, '/')} before:{endDate.replace(/-/g, '/')}</code>
                </p>
              </div>
            )}
          </div>

          {/* Sync Query & Max Email Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-blue-400" />
                Gmail Search Query Filter
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Max Emails:</span>
                <select
                  value={maxResults}
                  onChange={e => setMaxResults(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value={10}>10 emails</option>
                  <option value={15}>15 emails</option>
                  <option value={25}>25 emails</option>
                  <option value={50}>50 emails</option>
                </select>
              </div>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="e.g. devops job alert OR linkedin"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />

            {/* Live Effective Query Preview */}
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] space-y-1">
              <span className="text-slate-400 font-medium">Effective Gmail API Query:</span>
              <p className="text-slate-300 font-mono break-all text-[11px] bg-slate-900/90 p-1.5 rounded border border-slate-800">
                {getEffectiveQueryPreview()}
              </p>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => handleSyncAlerts(false)}
              disabled={isSyncing || !isLinked}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                isLinked
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-600/20 border border-blue-400/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing
                ? `Scanning Inbox for ${TIME_RANGE_PRESETS.find(p => p.id === timeRange)?.label || timeRange}...`
                : `Scan Gmail (${TIME_RANGE_PRESETS.find(p => p.id === timeRange)?.label || timeRange})`}
            </button>

            <button
              onClick={() => handleSyncAlerts(true)}
              disabled={isSyncing}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Test Range Simulation
            </button>
          </div>

          {/* Real-time Scanning Progress Bar */}
          {isSyncing && scanProgress && (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-blue-600/40 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                  <span className="font-semibold text-slate-200">
                    {scanProgress.message || 'Scanning emails...'}
                  </span>
                </div>
                <span className="font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800/60 text-xs">
                  {scanProgress.percent}%
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-lg shadow-cyan-500/20 relative"
                  style={{ width: `${Math.min(100, Math.max(5, scanProgress.percent))}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                </div>
              </div>

              {/* Live Status Indicators & Counters */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>
                    {scanProgress.total > 0
                      ? `Processing ${scanProgress.current} of ${scanProgress.total} emails`
                      : 'Connecting & querying Gmail API...'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50 font-mono">
                    +{scanProgress.importedCount} unique
                  </span>
                  {scanProgress.duplicatesCount > 0 && (
                    <span className="text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50 font-mono">
                      {scanProgress.duplicatesCount} duplicates filtered
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sync Results Preview */}
          {syncResult && (
            <div className="p-4 rounded-xl bg-slate-950 border border-blue-900/50 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Sync Run Completed ({syncResult.rangeLabel || timeRange})
                </span>
                <span className="text-slate-400">
                  {syncResult.emailsScanned} emails scanned • {syncResult.syncedCount} unique imported
                  {typeof syncResult.duplicatesSkipped === 'number' && syncResult.duplicatesSkipped > 0 && (
                    <span className="text-amber-400 font-medium"> • {syncResult.duplicatesSkipped} duplicates skipped</span>
                  )}
                </span>
              </div>

              {syncResult.jobs.length > 0 ? (
                <div className="space-y-2">
                  {syncResult.jobs.map(job => (
                    <div
                      key={job.id}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white truncate">{job.title}</p>
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded font-mono shrink-0">
                            {job.postedDate}
                          </span>
                        </div>
                        <p className="text-slate-400 truncate">{job.company} • {job.location} ({job.remoteType})</p>
                        {job.url && (
                          <div className="pt-1">
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 text-[11px] hover:underline"
                            >
                              <span>Direct Job Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {job.matchAnalysis?.overallScore || 85}% Match
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No new un-imported job opportunities discovered in this time range.
                </p>
              )}
            </div>
          )}

          {/* SQLite Sync Logs */}
          <div className="space-y-2.5 pt-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Recent Gmail Ingest Logs (SQLite Persisted)
            </h3>

            {syncHistory.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                No Gmail sync logs yet. Run a sync above to fetch job alerts.
              </div>
            ) : (
              <div className="space-y-1.5">
                {syncHistory.slice(0, 4).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <div>
                        <span className="text-slate-300 font-mono text-[11px]">
                          {new Date(item.syncDate).toLocaleString()}
                        </span>
                        {item.query && (
                          <p className="text-[10px] text-slate-500 truncate max-w-xs font-mono">
                            {item.query}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {item.emailsScanned} scanned, {item.jobsImported} imported
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Read-only Gmail scope (`gmail.readonly`). Never sends or modifies your emails.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
