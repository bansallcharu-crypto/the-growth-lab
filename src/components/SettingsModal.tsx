import React, { useState, useEffect } from 'react';
import { X, Key, User, Download, Upload, RotateCcw, Check, Sparkles, ShieldCheck, Database } from 'lucide-react';
import { UserProfile, ThoughtFrameworkType } from '../types';
import { StorageService } from '../services/storage';
import { AIService } from '../services/aiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onDataReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onDataReset,
}) => {
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const [openAIKey, setOpenAIKey] = useState('');
  const [openAIModel, setOpenAIModel] = useState('gpt-4o-mini');
  const [hasServerKey, setHasServerKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      AIService.checkBackendStatus().then((st) => {
        setHasServerKey(st.hasOpenAIKey);
        if (st.model) setOpenAIModel(st.model);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    StorageService.saveProfile(formData);

    if (openAIKey.trim()) {
      await AIService.setServerApiKey(openAIKey.trim(), openAIModel);
      setHasServerKey(true);
      setOpenAIKey('');
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleDownloadBackup = () => {
    const json = StorageService.exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `the-growth-lab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const success = StorageService.importBackupData(text);
        if (success) {
          setImportStatus('Backup restored successfully! Refreshing...');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setImportStatus('Failed to parse backup JSON.');
        }
      } catch (err) {
        setImportStatus('Error importing file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all data and study progress back to default state?')) {
      StorageService.resetAllToDefaults();
      onDataReset();
      onClose();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-3xl border border-cream-200 shadow-soft-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cream-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cobalt-600 text-white flex items-center justify-center shadow-soft">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-ink-900 text-base">Studio Settings & Goals</h3>
              <p className="text-xs text-ink-500">Personalize your learning routine, OpenAI models & database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-400 hover:text-ink-700 hover:bg-cream-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form id="settings-form" onSubmit={handleSave} className="space-y-5">
            {/* User Profile */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-400">Personal Profile</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-200 rounded-xl px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-200 rounded-xl px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">Degree & Semester</label>
                  <input
                    type="text"
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-200 rounded-xl px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">Location / College</label>
                  <input
                    type="text"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-200 rounded-xl px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500"
                  />
                </div>
              </div>
            </div>

            {/* Daily Practice Commitment */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-400">Daily Study Habit</h4>
              <label className="block text-xs font-semibold text-ink-700">Preferred Daily Practice Time</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((mins) => (
                  <button
                    type="button"
                    key={mins}
                    onClick={() => setFormData({ ...formData, preferredDailyMinutes: mins })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      formData.preferredDailyMinutes === mins
                        ? 'bg-cobalt-600 text-white border-cobalt-600 shadow-soft'
                        : 'bg-white text-ink-700 border-cream-200 hover:border-cobalt-300'
                    }`}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-ink-400">
                The Growth Lab prioritizes small daily consistency over long, exhausting sessions.
              </p>
            </div>

            {/* Preferred Thought Framework */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-ink-700">Default Thought Structure</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'PRE' as ThoughtFrameworkType, name: 'Point → Reason → Example' },
                  { id: 'PAS' as ThoughtFrameworkType, name: 'Problem → Analysis → Solution' },
                  { id: 'SAR' as ThoughtFrameworkType, name: 'Situation → Action → Result' },
                  { id: 'CEC' as ThoughtFrameworkType, name: 'Claim → Evidence → Conclusion' },
                ].map((fw) => (
                  <button
                    type="button"
                    key={fw.id}
                    onClick={() => setFormData({ ...formData, selectedFramework: fw.id })}
                    className={`p-2.5 rounded-xl text-left border text-xs font-semibold transition-all ${
                      formData.selectedFramework === fw.id
                        ? 'bg-cobalt-50 border-cobalt-400 text-cobalt-900 font-bold'
                        : 'bg-white border-cream-200 text-ink-700 hover:bg-cream-100'
                    }`}
                  >
                    <div className="font-bold">{fw.id}</div>
                    <div className="text-[11px] text-ink-500">{fw.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Genuine OpenAI Integration */}
            <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-cobalt-600" />
                  <h4 className="text-sm font-bold text-ink-900">OpenAI API Server Integration</h4>
                </div>
                {hasServerKey ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Key Not Set
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-500 leading-relaxed">
                Powers natural ChatGPT-style conversational assistant and Whisper audio speech-to-text. Keys are stored privately and securely on the backend server and never exposed to the frontend.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-ink-600 mb-1">OpenAI Model</label>
                  <select
                    value={openAIModel}
                    onChange={(e) => setOpenAIModel(e.target.value)}
                    className="w-full bg-white border border-cream-200 rounded-xl px-3 py-1.5 text-xs text-ink-900"
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini (Fast, smart & token-efficient)</option>
                    <option value="gpt-4o">gpt-4o (Most capable flagship)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-600 mb-1">
                    {hasServerKey ? 'Update API Key (Optional)' : 'OpenAI API Key'}
                  </label>
                  <input
                    type="password"
                    value={openAIKey}
                    onChange={(e) => setOpenAIKey(e.target.value)}
                    placeholder={hasServerKey ? '••••••••••••••••' : 'sk-proj-...'}
                    className="w-full bg-white border border-cream-200 rounded-xl px-3 py-1.5 text-xs font-mono text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-ink-400">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <Database className="w-3 h-3" /> Persistent SQLite storage active
                </span>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cobalt-600 hover:underline font-semibold"
                >
                  Get API Key from OpenAI →
                </a>
              </div>
            </div>

            {/* Accessibility & Motion */}
            <div className="flex items-center justify-between py-2 border-t border-cream-200">
              <div>
                <span className="text-xs font-semibold text-ink-800 block">Reduce Motion</span>
                <span className="text-[11px] text-ink-400">Disable celebratory confetti & animations</span>
              </div>
              <input
                type="checkbox"
                checked={formData.reducedMotion}
                onChange={(e) => setFormData({ ...formData, reducedMotion: e.target.checked })}
                className="w-4 h-4 accent-cobalt-600 rounded cursor-pointer"
              />
            </div>
          </form>

          {/* Backup & Data Persistence Section */}
          <div className="pt-4 border-t border-cream-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-400">Data & Persistence</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cream-50 border border-cream-200 text-xs font-semibold text-ink-700 hover:bg-cream-100 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Backup (JSON)</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cream-50 border border-cream-200 text-xs font-semibold text-ink-700 hover:bg-cream-100 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Restore Backup</span>
                <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
              </label>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults</span>
              </button>
            </div>
            {importStatus && <p className="text-xs font-semibold text-cobalt-600">{importStatus}</p>}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-cream-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-cream-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="settings-form"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cobalt-600 text-white text-xs font-bold hover:bg-cobalt-700 shadow-soft transition-all active:scale-95"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Settings Saved!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
