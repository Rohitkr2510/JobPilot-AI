import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  User, 
  Award, 
  CheckCircle2, 
  Sliders, 
  Lock, 
  Briefcase, 
  Terminal, 
  GraduationCap, 
  Cloud, 
  AlertTriangle,
  Database,
  Layers,
  FileText,
  Save,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Edit3,
  Eye,
  RefreshCw,
  Sparkles,
  ExternalLink,
  MapPin,
  DollarSign,
  Clock,
  Check,
  Code2,
  Tag
} from 'lucide-react';
import { MasterCandidateProfile, ScoringWeights, UploadedResumeRecord, JobOpportunity } from '../types';

interface MasterProfileViewProps {
  profile: MasterCandidateProfile;
  weights: ScoringWeights;
  onUpdateWeights: (weights: ScoringWeights) => void;
  onProfileUpdated?: (newProfile: MasterCandidateProfile, updatedJobs?: JobOpportunity[]) => void;
  onOpenResumeUpload?: () => void;
  onToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

type ProfileTab = 'editor' | 'resume' | 'weights';

const SKILL_CATEGORIES: {
  key: keyof MasterCandidateProfile['skills'];
  label: string;
  icon: string;
  description: string;
}[] = [
  { key: 'cloud', label: 'Cloud & Infrastructure', icon: '☁️', description: 'AWS, Azure, GCP, VPC, IAM, S3, EC2' },
  { key: 'containers', label: 'Containers & Kubernetes', icon: '📦', description: 'Docker, Kubernetes, EKS, Helm, Service Mesh' },
  { key: 'cicd', label: 'CI/CD & Automation', icon: '🔄', description: 'Jenkins, Groovy Shared Libraries, GitHub Actions, GitLab CI' },
  { key: 'iac', label: 'Infrastructure as Code (IaC)', icon: '🏗️', description: 'Terraform, HCL, State Management, Ansible, Bash' },
  { key: 'security', label: 'DevSecOps & Security', icon: '🛡️', description: 'Checkmarx SAST, Orca Security, Trivy, Secret Scanning' },
  { key: 'releaseManagement', label: 'Release Governance', icon: '📋', description: 'Plutora, Jira, CAB Change Management, Playbooks' },
  { key: 'scripting', label: 'Scripting & Programming', icon: '💻', description: 'Python, Groovy, Bash / Shell, Linux Administration' },
  { key: 'monitoring', label: 'Monitoring & Observability', icon: '📊', description: 'CloudWatch, Prometheus, Grafana, Alerting & MTTR' },
];

export const MasterProfileView: React.FC<MasterProfileViewProps> = ({
  profile,
  weights,
  onUpdateWeights,
  onProfileUpdated,
  onOpenResumeUpload,
  onToast
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('editor');

  // Parsed Profile State
  const [editedProfile, setEditedProfile] = useState<MasterCandidateProfile>(profile);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [newSkillInputs, setNewSkillInputs] = useState<Record<string, string>>({});
  const [hasProfileChanges, setHasProfileChanges] = useState(false);

  // Latest Uploaded Resume State
  const [latestResume, setLatestResume] = useState<UploadedResumeRecord | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [isEditingRawResume, setIsEditingRawResume] = useState(false);
  const [rawResumeDraft, setRawResumeDraft] = useState('');
  const [isSavingRawResume, setIsSavingRawResume] = useState(false);
  const [isReparsing, setIsReparsing] = useState(false);
  const [copiedRawText, setCopiedRawText] = useState(false);

  // Weights State
  const [localWeights, setLocalWeights] = useState<ScoringWeights>(weights);

  // Keep local edited profile in sync when incoming profile prop changes
  useEffect(() => {
    setEditedProfile(profile);
    setHasProfileChanges(false);
  }, [profile]);

  // Fetch Latest Uploaded Resume from SQLite
  const fetchLatestResume = async () => {
    setIsLoadingResume(true);
    try {
      const res = await fetch('/api/resume/latest');
      if (res.ok) {
        const data = await res.json();
        if (data.resume) {
          setLatestResume(data.resume);
          setRawResumeDraft(data.resume.rawText || '');
        }
      }
    } catch (err) {
      console.warn('Could not fetch latest resume:', err);
    } finally {
      setIsLoadingResume(false);
    }
  };

  useEffect(() => {
    fetchLatestResume();
  }, []);

  // Track profile changes
  const updateProfileField = <K extends keyof MasterCandidateProfile>(
    field: K,
    value: MasterCandidateProfile[K]
  ) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
    setHasProfileChanges(true);
  };

  // Skill Tags Management
  const handleAddSkill = (categoryKey: keyof MasterCandidateProfile['skills']) => {
    const inputVal = (newSkillInputs[categoryKey] || '').trim();
    if (!inputVal) return;

    const currentList = editedProfile.skills[categoryKey] || [];
    if (currentList.includes(inputVal)) {
      if (onToast) onToast(`"${inputVal}" is already in ${categoryKey}`, 'info');
      return;
    }

    const updatedList = [...currentList, inputVal];
    setEditedProfile(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [categoryKey]: updatedList
      }
    }));
    setNewSkillInputs(prev => ({ ...prev, [categoryKey]: '' }));
    setHasProfileChanges(true);
  };

  const handleRemoveSkill = (categoryKey: keyof MasterCandidateProfile['skills'], skillToRemove: string) => {
    const currentList = editedProfile.skills[categoryKey] || [];
    const updatedList = currentList.filter(s => s !== skillToRemove);
    setEditedProfile(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [categoryKey]: updatedList
      }
    }));
    setHasProfileChanges(true);
  };

  // Achievement / RAG Evidence Management
  const handleAddAchievement = () => {
    const newId = `ach-${Date.now()}`;
    const newAch = {
      id: newId,
      category: 'cicd' as const,
      bullet: 'Spearheaded automated engineering workflows delivering measurable efficiency gains.',
      metrics: '40% improvement in release cycles',
      verified: true
    };
    setEditedProfile(prev => ({
      ...prev,
      verifiedAchievements: [newAch, ...prev.verifiedAchievements]
    }));
    setHasProfileChanges(true);
  };

  const handleUpdateAchievement = (id: string, field: 'category' | 'bullet' | 'metrics' | 'verified', val: any) => {
    setEditedProfile(prev => ({
      ...prev,
      verifiedAchievements: prev.verifiedAchievements.map(ach => 
        ach.id === id ? { ...ach, [field]: val } : ach
      )
    }));
    setHasProfileChanges(true);
  };

  const handleDeleteAchievement = (id: string) => {
    setEditedProfile(prev => ({
      ...prev,
      verifiedAchievements: prev.verifiedAchievements.filter(ach => ach.id !== id)
    }));
    setHasProfileChanges(true);
  };

  // Save Candidate Profile to SQLite
  const handleSaveProfileToSqlite = async () => {
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: editedProfile }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save profile');
      }

      const data = await res.json();
      setHasProfileChanges(false);
      if (onProfileUpdated) {
        onProfileUpdated(data.profile || editedProfile, data.jobs);
      }
      if (onToast) {
        onToast(
          `Profile saved in SQLite! ${data.updatedJobsCount || 0} active jobs re-scored against updated profile.`,
          'success'
        );
      }
    } catch (err: any) {
      if (onToast) onToast(err.message || 'Error saving to SQLite', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save Raw Resume Draft to SQLite
  const handleSaveRawResume = async () => {
    if (!rawResumeDraft.trim()) {
      if (onToast) onToast('Resume text cannot be empty', 'error');
      return;
    }
    setIsSavingRawResume(true);
    try {
      const res = await fetch('/api/resume/raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rawResumeDraft,
          fileName: latestResume?.fileName || 'Updated_Resume.txt',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save raw resume');
      }

      const data = await res.json();
      if (data.resume) {
        setLatestResume(data.resume);
      }
      setIsEditingRawResume(false);
      if (onToast) onToast('Raw resume saved in SQLite table: uploaded_resumes', 'success');
    } catch (err: any) {
      if (onToast) onToast(err.message || 'Error saving resume to SQLite', 'error');
    } finally {
      setIsSavingRawResume(false);
    }
  };

  // Re-Parse Raw Resume with AI / Local Engine and Save to SQLite
  const handleReparseRawResume = async () => {
    if (!rawResumeDraft.trim() || rawResumeDraft.trim().length < 50) {
      if (onToast) onToast('Please provide sufficient resume text (at least 50 characters).', 'error');
      return;
    }
    setIsReparsing(true);
    try {
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: rawResumeDraft,
          fileName: latestResume?.fileName || 'Raw_Resume_Update.txt',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to parse resume');
      }

      const data = await res.json();
      if (data.profile) {
        setEditedProfile(data.profile);
        setHasProfileChanges(false);
        if (data.resume) setLatestResume(data.resume);
        if (onProfileUpdated) {
          onProfileUpdated(data.profile, data.jobs);
        }
        setIsEditingRawResume(false);
        if (onToast) {
          onToast(`Resume parsed & synced to SQLite! ${data.updatedJobsCount || 0} jobs re-scored.`, 'success');
        }
      }
    } catch (err: any) {
      if (onToast) onToast(err.message || 'Error parsing resume', 'error');
    } finally {
      setIsReparsing(false);
    }
  };

  // Copy Raw Resume Text
  const handleCopyRawText = () => {
    const textToCopy = rawResumeDraft || latestResume?.rawText || '';
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedRawText(true);
    setTimeout(() => setCopiedRawText(false), 2000);
    if (onToast) onToast('Raw resume text copied to clipboard', 'info');
  };

  // Download Raw Resume as .txt
  const handleDownloadRawResume = () => {
    const text = rawResumeDraft || latestResume?.rawText || '';
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = latestResume?.fileName || 'Rohit_Resume.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Scoring Weights Change
  const handleWeightChange = (key: keyof ScoringWeights, val: number) => {
    const updated = { ...localWeights, [key]: val };
    setLocalWeights(updated);
    onUpdateWeights(updated);
  };

  const totalWeight = (Object.values(localWeights) as number[]).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Tab Selector */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>SQLite Persistent Storage</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                jobpilot.db
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Candidate Profile & Resume Center</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              View your latest uploaded resume document, edit the detailed parsed profile fields, manage verified RAG evidence, and configure hybrid scoring weights — all backed by SQLite.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {onOpenResumeUpload && (
              <button
                onClick={onOpenResumeUpload}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-700/50 text-xs font-semibold shadow transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New Resume</span>
              </button>
            )}

            {hasProfileChanges && (
              <button
                onClick={handleSaveProfileToSqlite}
                disabled={isSavingProfile}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 border border-emerald-400/40 transition-all hover:scale-[1.02] cursor-pointer animate-pulse"
              >
                {isSavingProfile ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to SQLite...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes to SQLite</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Inner Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/40'
                : 'bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Parsed Profile & Live Editor</span>
            {hasProfileChanges && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('resume');
              fetchLatestResume();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'resume'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/40'
                : 'bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Latest Uploaded Resume</span>
            {latestResume && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-900 text-cyan-300 border border-cyan-800/50 font-mono">
                {latestResume.fileName.slice(0, 16)}...
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('weights')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'weights'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/40'
                : 'bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Scoring Weights & Guardrails</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PARSED PROFILE & LIVE EDITOR */}
      {/* ========================================================================= */}
      {activeTab === 'editor' && (
        <div className="space-y-6">
          
          {/* Top Save & Reset Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Parsed Profile Field Editor</h3>
                <p className="text-xs text-slate-400">
                  {hasProfileChanges
                    ? '⚠️ You have unsaved changes in memory. Click "Save to SQLite" to persist and re-score jobs.'
                    : '✅ All candidate profile fields are synchronized with SQLite database (table: candidate_profile).'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {hasProfileChanges && (
                <button
                  onClick={() => {
                    setEditedProfile(profile);
                    setHasProfileChanges(false);
                    if (onToast) onToast('Reverted unsaved edits to current saved SQLite state.', 'info');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 cursor-pointer"
                >
                  Discard Edits
                </button>
              )}

              <button
                onClick={handleSaveProfileToSqlite}
                disabled={isSavingProfile || !hasProfileChanges}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  hasProfileChanges
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                {isSavingProfile ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to SQLite...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to SQLite</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Section 1: Contact & Personal Details */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <User className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Contact & Online Identity</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Candidate Full Name</label>
                  <input
                    type="text"
                    value={editedProfile.name || ''}
                    onChange={e => updateProfileField('name', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Rohit Kumar Mahato"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Target Role Headline</label>
                  <input
                    type="text"
                    value={editedProfile.targetRole || ''}
                    onChange={e => updateProfileField('targetRole', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="DevOps Engineer / Cloud Platform Engineer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Email Address</label>
                  <input
                    type="email"
                    value={editedProfile.email || ''}
                    onChange={e => updateProfileField('email', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="rs6578264@gmail.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Phone Number</label>
                  <input
                    type="text"
                    value={editedProfile.phone || ''}
                    onChange={e => updateProfileField('phone', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Current Location</label>
                  <input
                    type="text"
                    value={editedProfile.location || ''}
                    onChange={e => updateProfileField('location', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Bangalore, India"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Portfolio / Dashboard URL</label>
                  <input
                    type="text"
                    value={editedProfile.portfolioUrl || ''}
                    onChange={e => updateProfileField('portfolioUrl', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="https://jobpilot.devops.internal"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    value={editedProfile.linkedinUrl || ''}
                    onChange={e => updateProfileField('linkedinUrl', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none font-mono"
                    placeholder="https://linkedin.com/in/rohit-kumar-mahato"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">GitHub Profile URL</label>
                  <input
                    type="text"
                    value={editedProfile.githubUrl || ''}
                    onChange={e => updateProfileField('githubUrl', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none font-mono"
                    placeholder="https://github.com/Rohitkr2510/"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">LeetCode Profile URL</label>
                  <input
                    type="text"
                    value={editedProfile.leetcodeUrl || ''}
                    onChange={e => updateProfileField('leetcodeUrl', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none font-mono"
                    placeholder="https://leetcode.com/u/Rohitkr2510/"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-400 font-medium">AWS Credly Verification Badge URL</label>
                  <input
                    type="text"
                    value={editedProfile.credlyUrl || ''}
                    onChange={e => updateProfileField('credlyUrl', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none font-mono"
                    placeholder="https://www.credly.com/badges/a430887f-a205-409e-a764-a7972f31b0d0/linked_in_profile"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Experience & Education */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Briefcase className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Career History & Education</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Current Employer</label>
                  <input
                    type="text"
                    value={editedProfile.currentCompany || ''}
                    onChange={e => updateProfileField('currentCompany', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Tata Consultancy Services (TCS)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Current Job Title</label>
                  <input
                    type="text"
                    value={editedProfile.currentRole || ''}
                    onChange={e => updateProfileField('currentRole', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="DevOps Engineer"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-400 font-medium">Current Tenure & Location</label>
                  <input
                    type="text"
                    value={editedProfile.currentExperiencePeriod || ''}
                    onChange={e => updateProfileField('currentExperiencePeriod', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none font-mono"
                    placeholder="April 2025 – Present | Bangalore, India"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Previous Employer</label>
                  <input
                    type="text"
                    value={editedProfile.previousCompany || ''}
                    onChange={e => updateProfileField('previousCompany', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Celebrare"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Previous Job Title</label>
                  <input
                    type="text"
                    value={editedProfile.previousRole || ''}
                    onChange={e => updateProfileField('previousRole', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Python Developer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Previous Tenure</label>
                  <input
                    type="text"
                    value={editedProfile.previousExperiencePeriod || ''}
                    onChange={e => updateProfileField('previousExperiencePeriod', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none font-mono"
                    placeholder="February 2024 – March 2025"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Total Experience (Years)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="40"
                    value={editedProfile.totalExperienceYears || 0}
                    onChange={e => updateProfileField('totalExperienceYears', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-400 font-medium">Highest Degree & University</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={editedProfile.highestDegree || ''}
                      onChange={e => updateProfileField('highestDegree', e.target.value)}
                      className="w-full sm:col-span-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="B.Tech in Computer Science & Engineering"
                    />
                    <input
                      type="text"
                      value={editedProfile.cgpa || ''}
                      onChange={e => updateProfileField('cgpa', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none font-mono"
                      placeholder="CGPA: 8.57"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-400 font-medium">Certifications (e.g. AWS SAA)</label>
                  <input
                    type="text"
                    value={editedProfile.certification || ''}
                    onChange={e => updateProfileField('certification', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="AWS Certified Solutions Architect – Associate (SAA-C03)"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Logistics & Compensation */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 lg:col-span-2">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Logistics, Notice Period & Compensation</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Notice Period</label>
                  <input
                    type="text"
                    value={editedProfile.noticePeriod || ''}
                    onChange={e => updateProfileField('noticePeriod', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="30 Days (Negotiable)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Expected Salary / CTC</label>
                  <input
                    type="text"
                    value={editedProfile.expectedSalary || ''}
                    onChange={e => updateProfileField('expectedSalary', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="₹18,00,000 - ₹22,00,000 INR"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Work Authorization</label>
                  <input
                    type="text"
                    value={editedProfile.workAuthorization || ''}
                    onChange={e => updateProfileField('workAuthorization', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Indian Citizen"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Relocation Preferences</label>
                  <input
                    type="text"
                    value={editedProfile.relocation || ''}
                    onChange={e => updateProfileField('relocation', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Bangalore, Pune, Hyderabad, Remote"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Section 4: Audited Skill Registry (Categorized Tag Editor) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Audited Skills Categorization</h3>
              </div>
              <p className="text-xs text-slate-400">
                Click <span className="text-red-400 font-bold">✕</span> on any skill tag to remove, or type in the box and press Enter to add.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SKILL_CATEGORIES.map(cat => {
                const skillsList = editedProfile.skills[cat.key] || [];
                const currentInput = newSkillInputs[cat.key] || '';

                return (
                  <div
                    key={cat.key}
                    className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{cat.icon}</span>
                        <div>
                          <span className="text-xs font-bold text-slate-200">{cat.label}</span>
                          <span className="ml-2 text-[10px] text-slate-500 font-mono">({skillsList.length} skills)</span>
                        </div>
                      </div>
                    </div>

                    {/* Skill Tags List */}
                    <div className="flex flex-wrap gap-1.5 min-h-[38px] items-center">
                      {skillsList.map(skill => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-medium transition-colors group"
                        >
                          <span>{skill}</span>
                          <button
                            onClick={() => handleRemoveSkill(cat.key, skill)}
                            title={`Remove ${skill}`}
                            className="text-slate-500 hover:text-red-400 font-bold ml-0.5 cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      ))}

                      {skillsList.length === 0 && (
                        <span className="text-xs text-slate-600 italic">No skills added in this category yet.</span>
                      )}
                    </div>

                    {/* Add Skill Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={currentInput}
                        onChange={e => setNewSkillInputs(prev => ({ ...prev, [cat.key]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill(cat.key);
                          }
                        }}
                        placeholder={`+ Add skill to ${cat.label}...`}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddSkill(cat.key)}
                        disabled={!currentInput.trim()}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          currentInput.trim()
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: RAG Evidence & Verified Achievements Database */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">
                    RAG Candidate Evidence Bank ({editedProfile.verifiedAchievements.length} Records)
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Every resume customization and cold outreach draft pulls directly from these verified achievement records.
                </p>
              </div>

              <button
                onClick={handleAddAchievement}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Verified Evidence Record</span>
              </button>
            </div>

            <div className="space-y-4">
              {editedProfile.verifiedAchievements.map((ach, idx) => (
                <div
                  key={ach.id || idx}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 transition-all hover:border-slate-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1}</span>
                      
                      {/* Category Selector */}
                      <select
                        value={ach.category}
                        onChange={e => handleUpdateAchievement(ach.id, 'category', e.target.value)}
                        className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-blue-300 text-xs font-mono font-semibold focus:outline-none"
                      >
                        <option value="cicd">CI/CD Automation</option>
                        <option value="cloud_iac">Cloud & IaC</option>
                        <option value="security">DevSecOps & Security</option>
                        <option value="release">Release Governance</option>
                        <option value="monitoring">Monitoring & MTTR</option>
                        <option value="python">Python & Microservices</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Verified Toggle */}
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ach.verified}
                          onChange={e => handleUpdateAchievement(ach.id, 'verified', e.target.checked)}
                          className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <span className="font-semibold text-emerald-400">Verified Evidence</span>
                      </label>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteAchievement(ach.id)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-900 cursor-pointer"
                        title="Delete achievement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Measurable Metric Tag */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-emerald-400">Quantifiable Metric Tag</label>
                    <input
                      type="text"
                      value={ach.metrics || ''}
                      onChange={e => handleUpdateAchievement(ach.id, 'metrics', e.target.value)}
                      placeholder="e.g. 95% reduction in failures, 40% cycle time reduction"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Bullet Content Narrative */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Achievement Narrative & Technical Implementation</label>
                    <textarea
                      rows={2}
                      value={ach.bullet || ''}
                      onChange={e => handleUpdateAchievement(ach.id, 'bullet', e.target.value)}
                      placeholder="Detailed STAR format achievement bullet..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Bottom Save Bar when Changes Exist */}
          {hasProfileChanges && (
            <div className="sticky bottom-6 z-30 p-4 bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 rounded-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-semibold text-slate-200">
                  You have pending profile modifications. Save to SQLite to update persistent database and re-score matching algorithms.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditedProfile(profile);
                    setHasProfileChanges(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveProfileToSqlite}
                  disabled={isSavingProfile}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/40 cursor-pointer"
                >
                  {isSavingProfile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes to SQLite</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LATEST UPLOADED RESUME DOCUMENT VIEWER & RAW EDITOR */}
      {/* ========================================================================= */}
      {activeTab === 'resume' && (
        <div className="space-y-6">
          
          {/* Resume Header & Metadata Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      {latestResume?.fileName || 'Rohit_DevOps_Resume_Latest.txt'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Active Upload
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Uploaded: {latestResume ? new Date(latestResume.uploadedAt).toLocaleString() : 'Active in SQLite'}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400 font-mono">SQLite Table: uploaded_resumes</span>
                  </p>
                </div>
              </div>

              {/* Stats Badges */}
              <div className="flex items-center gap-2 text-xs">
                <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                  <span className="text-slate-500 mr-1">Words:</span>
                  <span className="font-mono font-bold text-white">
                    {rawResumeDraft.split(/\s+/).filter(Boolean).length}
                  </span>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                  <span className="text-slate-500 mr-1">Characters:</span>
                  <span className="font-mono font-bold text-white">
                    {rawResumeDraft.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingRawResume(!isEditingRawResume)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isEditingRawResume
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingRawResume ? 'Exit Raw Edit Mode' : 'Edit Raw Resume Text'}</span>
                </button>

                <button
                  onClick={handleCopyRawText}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copiedRawText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadRawResume}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {onOpenResumeUpload && (
                  <button
                    onClick={onOpenResumeUpload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New File</span>
                  </button>
                )}

                <button
                  onClick={handleReparseRawResume}
                  disabled={isReparsing}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 border border-blue-400/40 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  {isReparsing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Parsing & Rescoring...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                      <span>Re-Parse & Rescore Jobs</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Raw Text Editor or Document Display */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Editor Top Bar */}
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span className="font-mono font-bold text-slate-300">
                  {latestResume?.fileName || 'Rohit_DevOps_AWS_Resume_Latest.txt'}
                </span>
                <span className="px-2 py-0.2 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                  {isEditingRawResume ? 'EDIT MODE' : 'READ ONLY'}
                </span>
              </div>

              {isEditingRawResume && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveRawResume}
                    disabled={isSavingRawResume}
                    className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    {isSavingRawResume ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    <span>Save Raw to SQLite</span>
                  </button>
                </div>
              )}
            </div>

            {/* Content Area */}
            {isEditingRawResume ? (
              <div className="p-4 space-y-3">
                <textarea
                  rows={24}
                  value={rawResumeDraft}
                  onChange={e => setRawResumeDraft(e.target.value)}
                  className="w-full p-4 bg-slate-900/90 text-slate-100 font-mono text-xs leading-relaxed rounded-lg border border-slate-700 focus:border-cyan-500 focus:outline-none"
                  placeholder="Paste or write your full raw resume content here..."
                />
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>💡 Tip: Click "Re-Parse & Rescore Jobs" above to update candidate profile schema and re-match all active job descriptions.</span>
                  <button
                    onClick={handleReparseRawResume}
                    disabled={isReparsing}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Re-parse with AI</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 font-mono text-xs leading-relaxed text-slate-200 overflow-x-auto whitespace-pre-wrap select-text selection:bg-cyan-600 selection:text-white">
                {rawResumeDraft || (
                  <div className="py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>No resume text uploaded yet. Click "Upload New File" or "Edit Raw Resume Text" to add your resume.</p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SCORING WEIGHTS & ATS GUARDRAIL POLICIES */}
      {/* ========================================================================= */}
      {activeTab === 'weights' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: 7-Factor Hybrid Matching Weights */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">7-Factor Hybrid Scoring Weights</h3>
              </div>
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                totalWeight === 100 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                Total Sum: {totalWeight}% (Target: 100%)
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Customize the mathematical weight assigned to each ATS evaluation dimension when computing job match scores.
            </p>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>1. Technical Skills (Tools, DSL, Languages)</span>
                  <span className="font-mono text-cyan-400 font-bold">{localWeights.technical}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={localWeights.technical}
                  onChange={e => handleWeightChange('technical', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>2. Relevant Experience (Tenure & Role Alignment)</span>
                  <span className="font-mono text-cyan-400 font-bold">{localWeights.experience}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={localWeights.experience}
                  onChange={e => handleWeightChange('experience', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>3. Cloud & Infrastructure Mastery (AWS, EKS, VPC)</span>
                  <span className="font-mono text-cyan-400 font-bold">{localWeights.cloud}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={localWeights.cloud}
                  onChange={e => handleWeightChange('cloud', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>4. CI/CD & Pipeline Automation (Jenkins Shared Libs, GitHub Actions)</span>
                  <span className="font-mono text-cyan-400 font-bold">{localWeights.cicd}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={localWeights.cicd}
                  onChange={e => handleWeightChange('cicd', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>5. Seniority Level Fit (Junior vs Mid vs Senior)</span>
                  <span className="font-mono text-cyan-400 font-bold">{localWeights.seniority}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={localWeights.seniority}
                  onChange={e => handleWeightChange('seniority', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>6. Location & Work Authorization Match</span>
                  <span className="font-mono text-cyan-400 font-bold">{localWeights.location}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={localWeights.location}
                  onChange={e => handleWeightChange('location', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>7. Cloud Certifications (AWS Solutions Architect Associate)</span>
                  <span className="font-mono text-cyan-400 font-bold">{localWeights.certification}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={localWeights.certification}
                  onChange={e => handleWeightChange('certification', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Right 1 Col: Guardrail Policies */}
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Zero-Hallucination Guardrails</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Rule 1: Zero Employer Fabrication</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-snug">
                    Only verified employers from the parsed candidate profile can appear in generated resume tailoring.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Rule 2: Invariant Metrics Policy</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-snug">
                    40% cycle time reduction, 95% failure drop, and 50% MTTR cannot be inflated or fabricated.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Rule 3: Tech Integrity Gate</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-snug">
                    If a job description requests a missing technology, the system highlights it as a skill gap rather than claiming false knowledge.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Rule 4: SQLite Source of Truth</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-snug">
                    All candidate changes are persistently written to SQLite (`jobpilot.db`) ensuring data survival across restarts.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
