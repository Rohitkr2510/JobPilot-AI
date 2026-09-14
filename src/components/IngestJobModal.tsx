import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Mail, 
  Link, 
  FileText, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { JobOpportunity } from '../types';

interface IngestJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobIngested: (newJob: JobOpportunity) => void;
}

export const IngestJobModal: React.FC<IngestJobModalProps> = ({
  isOpen,
  onClose,
  onJobIngested
}) => {
  const [ingestMode, setIngestMode] = useState<'text' | 'url'>('text');
  const [inputText, setInputText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const sampleAlert = `Job Alert from LinkedIn / Instahyre:
Company: Atlassian
Position: DevOps / Site Reliability Engineer (Release & CI/CD)
Location: Bengaluru, India (Hybrid)
Experience: 3-6 years
Salary: 28 - 36 LPA

Job Description:
We are looking for a DevOps Engineer to join our Core Platform team in Bengaluru.
Key Responsibilities:
- Design, build, and maintain scalable CI/CD pipelines using Jenkins (Declarative pipelines and Groovy shared libraries).
- Manage cloud infrastructure on AWS (VPC, EC2, IAM, EKS, CloudWatch, Route 53) codified using Terraform.
- Collaborate with development squads to streamline release engineering workflows and shorten release cycles.
- Monitor Kubernetes clusters and production workloads using Prometheus, Grafana, and AWS CloudWatch to reduce MTTR.
- Implement DevSecOps automated vulnerability scanning (SAST/DAST) in deployment pipelines.

Requirements:
- Proven experience with Jenkins, Docker, and Kubernetes (Amazon EKS).
- Hands-on Terraform experience creating modular infrastructure.
- Scripting proficiency in Python or Bash.
- Strong knowledge of AWS networking, IAM, and security principles.
- AWS certification (Solutions Architect Associate) is a strong plus.`;

  const handleLoadSample = () => {
    setInputText(sampleAlert);
    setSourceUrl('https://www.atlassian.com/careers/devops-sre-bangalore');
    setErrorMsg(null);
  };

  const handleIngest = async () => {
    if (!inputText.trim()) {
      setErrorMsg('Please paste the email text, job description, or load the sample alert.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ingest-job-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: inputText,
          sourceUrl: sourceUrl || 'https://linkedin.com/jobs/view/devops'
        })
      });

      if (!res.ok) {
        throw new Error('Failed to parse and analyze job alert with AI');
      }

      const data = await res.json();
      if (data.job) {
        onJobIngested(data.job);
        onClose();
      } else {
        throw new Error('No job data returned');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with Gemini job extraction engine.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Ingest Job Alert & Trigger AI Match Analysis</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Paste email text from LinkedIn, Naukri, or a direct JD to automatically extract details & calculate Rohit's 7-factor match.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action helper button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIngestMode('text')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                ingestMode === 'text' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Raw Text / Email
            </button>
            <button
              onClick={() => setIngestMode('url')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                ingestMode === 'url' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Job URL + Details
            </button>
          </div>

          <button
            onClick={handleLoadSample}
            type="button"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline flex items-center gap-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Load Sample Atlassian DevOps Alert</span>
          </button>
        </div>

        {/* URL Input (if relevant) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">
            Source Job URL (optional):
          </label>
          <input
            type="url"
            placeholder="https://company.com/careers/devops-engineer"
            value={sourceUrl}
            onChange={e => setSourceUrl(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        {/* Text Input Area */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">
            Job Description / Email Alert Content:
          </label>
          <textarea
            rows={10}
            placeholder="Paste entire job alert email or full job requirements here..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
          />
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Model: gemini-3.8-flash (Structured Output)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleIngest}
              disabled={isLoading}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing & Scoring with Gemini...</span>
                </>
              ) : (
                <>
                  <span>Ingest & Run Match Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
