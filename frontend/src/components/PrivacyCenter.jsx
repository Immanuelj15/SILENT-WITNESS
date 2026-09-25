import React, { useState, useEffect } from 'react';
import { Shield, Lock, Trash2, Download, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';

export default function PrivacyCenter({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    audioStorageEnabled: false,
    transcriptStorageEnabled: true,
    retentionPeriodDays: 7,
    localProcessingEnabled: true,
    cloudProcessingEnabled: false,
    analyticsConsent: true
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/privacy/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error('Privacy settings fetch error:', e);
    }
  };

  const updateSetting = async (key, val) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    try {
      await fetch('http://localhost:8000/api/privacy/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setMsg({ type: 'success', text: 'Privacy preference saved' });
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      setMsg({ type: 'error', text: 'Failed to update setting' });
    }
  };

  const handleDeleteAllData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/privacy/data', {
        method: 'DELETE'
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'All user data, transcripts, and cached files permanently erased.' });
        setConfirmDelete(false);
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Error executing data deletion' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    const payload = JSON.stringify({
      exportDate: new Date().toISOString(),
      privacySettings: settings,
      note: 'Exported from Silent Witness Local Data Vault.'
    }, null, 2);

    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `silent_witness_privacy_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Privacy & Data Governance Center</h3>
              <p className="text-xs text-slate-400">
                Privacy-by-Design controls. You maintain full sovereignty over your voice and transcripts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg px-2.5 py-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {msg && (
          <div className={`p-3 rounded-lg text-xs font-medium mb-4 flex items-center gap-2 ${
            msg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}>
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{msg.text}</span>
          </div>
        )}

        {/* Setting Toggles Grid */}
        <div className="space-y-4 mb-6">
          {/* Audio Storage */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <div className="text-sm font-semibold text-slate-200">Raw Audio Storage</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Keep raw audio recordings after acoustic inference (Default: OFF for security).
              </p>
            </div>
            <button
              onClick={() => updateSetting('audioStorageEnabled', !settings.audioStorageEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                settings.audioStorageEnabled
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {settings.audioStorageEnabled ? 'ON (Warning)' : 'OFF (Zero Raw Audio)'}
            </button>
          </div>

          {/* Transcript Storage */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <div className="text-sm font-semibold text-slate-200">Transcript History Retention</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Preserve conversation transcripts for review and threat auditing.
              </p>
            </div>
            <button
              onClick={() => updateSetting('transcriptStorageEnabled', !settings.transcriptStorageEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                settings.transcriptStorageEnabled
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.transcriptStorageEnabled ? 'ACTIVE (7 Days)' : 'DISABLED'}
            </button>
          </div>

          {/* Retention Period Slider */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-200">Retention Horizon</span>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800">
                {settings.retentionPeriodDays} Days
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              value={settings.retentionPeriodDays}
              onChange={(e) => updateSetting('retentionPeriodDays', parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>1 Day (Ephemeral)</span>
              <span>7 Days (Recommended)</span>
              <span>30 Days (Extended)</span>
            </div>
          </div>

          {/* Processing Mode */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <div className="text-sm font-semibold text-slate-200">Local Privacy Mode</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Process audio and LLM reasoning exclusively on local device (GGUF / Nemotron).
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
              LOCAL HOSTED
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export My Data
            </button>
          </div>

          <div className="w-full sm:w-auto">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full sm:w-auto px-4 py-2 bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/60 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                DELETE ALL MY DATA
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400 font-medium">Are you sure?</span>
                <button
                  disabled={loading}
                  onClick={handleDeleteAllData}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition"
                >
                  {loading ? 'Deleting...' : 'Confirm Wipe'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
