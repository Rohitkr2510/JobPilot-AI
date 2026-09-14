import { RecommendationLevel, JobStatus } from '../types';

export function getScoreColor(score: number): {
  bg: string;
  text: string;
  border: string;
  badge: string;
} {
  if (score >= 90) {
    return {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    };
  }
  if (score >= 80) {
    return {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    };
  }
  if (score >= 70) {
    return {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    };
  }
  if (score >= 60) {
    return {
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
      badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40'
    };
  }
  return {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  };
}

export function getRecommendationBadge(rec?: RecommendationLevel): {
  label: string;
  color: string;
} {
  switch (rec) {
    case 'STRONG_APPLY':
      return { label: 'Strong Apply (90%+)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    case 'APPLY':
      return { label: 'Apply (80-89%)', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
    case 'REVIEW':
      return { label: 'Review (70-79%)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    case 'LOW_PRIORITY':
      return { label: 'Low Priority (60-69%)', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' };
    case 'SKIP':
    default:
      return { label: 'Skip (<60%)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
  }
}

export function getStatusBadge(status: JobStatus): {
  label: string;
  color: string;
} {
  switch (status) {
    case 'DISCOVERED':
      return { label: 'Discovered', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    case 'ANALYZING':
      return { label: 'Analyzing...', color: 'bg-indigo-950 text-indigo-300 border-indigo-700 animate-pulse' };
    case 'MATCHED':
      return { label: 'Matched', color: 'bg-cyan-950 text-cyan-300 border-cyan-700' };
    case 'RECOMMENDED':
      return { label: 'Recommended', color: 'bg-emerald-950 text-emerald-300 border-emerald-700' };
    case 'RESUME_READY':
      return { label: 'Resume Ready', color: 'bg-purple-950 text-purple-300 border-purple-700' };
    case 'READY_TO_APPLY':
      return { label: 'Ready to Apply', color: 'bg-amber-950 text-amber-300 border-amber-700 font-semibold' };
    case 'APPLIED':
      return { label: 'Applied', color: 'bg-blue-950 text-blue-300 border-blue-700' };
    case 'SCREENING':
      return { label: 'Screening', color: 'bg-teal-950 text-teal-300 border-teal-700' };
    case 'INTERVIEW':
      return { label: 'Interviewing', color: 'bg-violet-950 text-violet-300 border-violet-700 font-semibold' };
    case 'OFFER':
      return { label: 'Offer Received 🎉', color: 'bg-emerald-900 text-emerald-200 border-emerald-500 font-bold' };
    case 'REJECTED':
      return { label: 'Rejected', color: 'bg-zinc-900 text-zinc-400 border-zinc-700' };
    default:
      return { label: status, color: 'bg-slate-800 text-slate-300 border-slate-700' };
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}

export function generateSimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}
