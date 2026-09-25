import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Trash2,
  Download,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Cpu,
  Cloud,
  FileText,
  RotateCcw
} from 'lucide-react';
import apiClient from '../utils/apiClient';

export default function PrivacyCenter({ isOpen, onClose, isFullPage = true }) {
  const [settings, setSettings] = useState({
    audioStorageEnabled: false,
    transcriptStorageEnabled: true,
    retentionPeriodDays: 7,
    localProcessingEnabled: true,
    cloudProcessingEnabled: false,
    analyticsConsent: false,
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiClient.get('/api/privacy/settings');
      if (data && typeof data === 'object') {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch {
      // Fallback to strict defaults
    }
  };

  const updateSetting = async (key, val) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    try {
      await apiClient.put('/api/privacy/settings', updated);
      setNotification({ type: 'success', message: 'Privacy preferences updated successfully' });
      setTimeout(() => setNotification(null), 3500);
    } catch {
      setNotification({ type: 'error', message: 'Unable to sync privacy preferences with server' });
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const handleDeleteAllData = async () => {
    setLoading(true);
    try {
      await apiClient.delete('/api/privacy/data');
      setNotification({ type: 'success', message: 'All local conversation transcripts and cached evidence permanently erased.' });
      setConfirmDelete(false);
    } catch {
      setNotification({ type: 'error', message: 'Failed to complete data eradication request.' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    const exportPayload = {
      exportTimestamp: new Date().toISOString(),
      privacyPolicyVersion: '2.0.0-enterprise',
      settings,
      dataRetentionNote: 'Only derived threat signatures and cryptographic audit logs are preserved with user consent.',
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SilentWitness_Privacy_Export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotification({ type: 'success', message: 'Privacy profile exported successfully' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
      {/* Page Title & Subtitle */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Lock size={18} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Privacy & Data Controls
          </h2>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Control how Silent Witness handles your conversation data. Built with strict privacy-preserving local AI principles.
        </p>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: notification.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            border: `1px solid ${notification.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`,
            color: notification.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Privacy Settings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {/* Card 1: Raw Audio */}
        <div className="sw-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--surface-alt)', color: 'var(--text-secondary)' }}>
                <HardDrive size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Raw Audio Storage
                </h4>
                <span className={`badge ${settings.audioStorageEnabled ? 'badge-warning' : 'badge-neutral'}`}>
                  {settings.audioStorageEnabled ? 'ENABLED' : 'OFF'}
                </span>
              </div>
            </div>

            <input
              type="checkbox"
              checked={settings.audioStorageEnabled}
              onChange={(e) => updateSetting('audioStorageEnabled', e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Audio streams are processed in transient RAM for neural deepfake feature extraction and discarded immediately. Audio is not permanently stored.
          </p>
        </div>

        {/* Card 2: Transcript History & Retention */}
        <div className="sw-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                <FileText size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Transcript Retention
                </h4>
                <span className="badge badge-primary">
                  {settings.retentionPeriodDays} Days
                </span>
              </div>
            </div>

            <select
              value={settings.retentionPeriodDays}
              onChange={(e) => updateSetting('retentionPeriodDays', parseInt(e.target.value, 10))}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                fontSize: '12px',
                fontWeight: 600,
                outline: 'none',
              }}
            >
              <option value={1}>1 Day</option>
              <option value={7}>7 Days (Recommended)</option>
              <option value={30}>30 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Spoken transcripts are retained locally to generate court-admissible forensic proof packages in the event of fraud, then automatically expunged.
          </p>
        </div>

        {/* Card 3: Local AI Inference */}
        <div className="sw-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                <Cpu size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  On-Device Local AI
                </h4>
                <span className="badge badge-success">ACTIVE</span>
              </div>
            </div>

            <input
              type="checkbox"
              checked={settings.localProcessingEnabled}
              onChange={(e) => updateSetting('localProcessingEnabled', e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Voice feature extraction, acoustic anomaly detection, and transcript keyword pattern matching run on-device when supported by hardware.
          </p>
        </div>

        {/* Card 4: Cloud Telemetry */}
        <div className="sw-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--surface-alt)', color: 'var(--text-secondary)' }}>
                <Cloud size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Cloud Processing
                </h4>
                <span className="badge badge-neutral">OFF</span>
              </div>
            </div>

            <input
              type="checkbox"
              checked={settings.cloudProcessingEnabled}
              onChange={(e) => updateSetting('cloudProcessingEnabled', e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            No conversation audio or transcripts are sent to third-party cloud servers without your explicit real-time approval.
          </p>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="sw-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Data Rights & Portability
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
          Exercise your data rights under GDPR and Digital Personal Data Protection (DPDP) compliance frameworks.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={handleExportData} className="btn-secondary">
            <Download size={15} />
            <span>Export Evidence & Data Profile</span>
          </button>

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="btn-danger">
              <Trash2 size={15} />
              <span>Delete All Data</span>
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={handleDeleteAllData} className="btn-danger" disabled={loading}>
                <Trash2 size={15} />
                <span>Confirm Permanent Deletion</span>
              </button>
              <button onClick={() => setConfirmDelete(false)} className="btn-ghost">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
