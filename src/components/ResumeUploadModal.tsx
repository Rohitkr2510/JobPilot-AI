import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  X,
  FileCode,
  ShieldAlert,
  ArrowRight,
  Database
} from 'lucide-react';
import { MasterCandidateProfile, JobOpportunity } from '../types';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: MasterCandidateProfile;
  onProfileUpdated: (newProfile: MasterCandidateProfile, updatedJobs?: JobOpportunity[]) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onProfileUpdated,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<{
    profile: MasterCandidateProfile;
    updatedJobsCount: number;
    message: string;
  } | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setFileName(file.name);
    setParseResult(null);

    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
      reader.onload = e => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (parsed.skills || parsed.name) {
            setResumeText(JSON.stringify(parsed, null, 2));
          } else {
            setResumeText(content);
          }
        } catch {
          setResumeText(e.target?.result as string);
        }
      };
      reader.readAsText(file);
    } else {
      // For txt, pdf, docx, read text representation
      reader.onload = e => {
        const text = e.target?.result as string;
        setResumeText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleParseAndUpdate = async () => {
    if (!resumeText || resumeText.trim().length < 40) {
      onToast('Please upload a resume file or paste resume content first.', 'error');
      return;
    }

    setIsParsing(true);
    setParseResult(null);

    try {
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          fileName: fileName || 'Uploaded Resume',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to parse resume');
      }

      const data = await res.json();

      if (data.profile) {
        setParseResult({
          profile: data.profile,
          updatedJobsCount: data.updatedJobsCount || 0,
          message: data.message || 'Profile successfully updated and persisted in SQLite!',
        });

        onProfileUpdated(data.profile, data.jobs);
        onToast(
          `Master Profile updated for ${data.profile.name}! All SQLite jobs re-calculated.`,
          'success'
        );
      }
    } catch (err: any) {
      onToast(err.message || 'Error parsing resume', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const loadSampleResume = () => {
    const sample = `ROHIT KUMAR MAHATO
DevOps Engineer | AWS Certified Solutions Architect - Associate
Email: rs6578264@gmail.com | Phone: +91-9876543210 | Location: Bengaluru, India
LinkedIn: linkedin.com/in/rohit-kumar-mahato | GitHub: github.com/rohit-mahato

PROFESSIONAL SUMMARY
DevOps Engineer with 2+ years of experience in enterprise CI/CD automation, cloud infrastructure design, and DevSecOps governance. Spearheaded modernization of 25+ production deployment pipelines at TCS, reducing release cycle time by 40% and achieving 99.98% deployment success rate.

WORK EXPERIENCE
DevOps Engineer | Tata Consultancy Services (TCS)
April 2025 - Present | Bengaluru, India
• Architected and maintained 25+ declarative Jenkins CI/CD pipelines using Groovy Shared Libraries, slashing developer onboarding time by 60%.
• Provisioned high-availability AWS infrastructure (VPC, EKS, RDS, S3, IAM) utilizing modular Terraform, reducing configuration drift and provisioning errors by 95%.
• Integrated DevSecOps security scanning gates using Checkmarx SAST and Orca Security, eliminating critical vulnerabilities before production release.
• Automated release management tracking across Jira and Plutora, reducing deployment coordination overhead by 40%.

Python Developer | Celebrare
February 2024 - March 2025 | Remote
• Developed scalable backend microservices and REST APIs using Python (FastAPI/Django) and PostgreSQL, serving 150k+ active users.
• Containerized core services with Docker and optimized multi-stage build images, reducing container footprint by 55%.
• Automated daily batch data pipelines with Bash and Python, saving 15 manual engineering hours weekly.

TECHNICAL SKILLS
• Cloud & Infrastructure: AWS (VPC, EKS, IAM, S3, RDS, CloudWatch, Route53), Microsoft Azure
• Containerization & Orchestration: Kubernetes (EKS), Docker, Helm, Istio
• CI/CD & Automation: Jenkins, Groovy Shared Libraries, GitHub Actions, GitLab CI
• Infrastructure as Code: Terraform (Modular HCL, State Management), Ansible, Bash / Shell
• DevSecOps & Security: Checkmarx, Orca Security, Trivy, IAM RBAC, Vault
• Monitoring & Observability: Prometheus, Grafana, AWS CloudWatch, Datadog

EDUCATION & CERTIFICATIONS
• AWS Certified Solutions Architect - Associate (Validation ID: AWS-SAA-2025-0812)
• B.Tech in Computer Science & Engineering | CGPA: 8.6/10`;

    setResumeText(sample);
    setFileName('Rohit_DevOps_Resume_2026.txt');
    setActiveTab('paste');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Upload & Parse Recent Resume
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <Database className="w-3 h-3" /> Auto-Syncs SQLite
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload your latest resume to update the entire app's candidate profile, skills, and ATS job scores.
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
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Tabs: File Upload vs Direct Text Paste */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Upload File (PDF / TXT / JSON)
              </button>
              <button
                onClick={() => setActiveTab('paste')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Paste Resume Text
              </button>
            </div>

            <button
              onClick={loadSampleResume}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
            >
              Load Rohit's Latest Profile Resume
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div
              onDragOver={e => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-blue-500 bg-blue-950/20'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.json,.doc,.docx"
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className="p-4 rounded-full bg-blue-600/10 text-blue-400 mb-3 border border-blue-500/20">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-white">
                {fileName ? fileName : 'Click to select or drag & drop your resume'}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Supports PDF, TXT, and JSON formats. Extracts work experience, quantified metrics, tools, and certifications.
              </p>
            </div>
          )}

          {/* Paste Tab */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Resume Text / Markdown / JSON</span>
                <span>{resumeText.length} characters</span>
              </div>
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder="Paste the plain text of your resume here..."
                rows={9}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono leading-relaxed resize-none"
              />
            </div>
          )}

          {/* What will update notice */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
            <p className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              What this update does across JobPilot AI:
            </p>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li>Replaces active candidate skills, achievements, and contact links in SQLite.</li>
              <li>Re-scores all saved job opportunities with fresh match percentages and gap analyses.</li>
              <li>Refreshes 1-Page ATS Resume generation rules with your new experience metrics.</li>
            </ul>
          </div>

          {/* Parse Result Summary */}
          {parseResult && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 space-y-2.5 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Resume Successfully Parsed & SQLite Synchronized</span>
              </div>
              <p className="text-xs text-slate-300">{parseResult.message}</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block">Candidate</span>
                  <span className="font-semibold text-white truncate block">{parseResult.profile.name}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block">Target Role</span>
                  <span className="font-semibold text-white truncate block">{parseResult.profile.targetRole}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block">Jobs Re-Calculated</span>
                  <span className="font-semibold text-emerald-400 block">{parseResult.updatedJobsCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleParseAndUpdate}
            disabled={isParsing || !resumeText.trim()}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
              resumeText.trim()
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/20 border border-cyan-400/40'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isParsing ? 'animate-spin' : ''}`} />
            {isParsing ? 'Parsing with Gemini AI & Updating SQLite...' : 'Parse & Update App Content'}
          </button>
        </div>
      </div>
    </div>
  );
};
