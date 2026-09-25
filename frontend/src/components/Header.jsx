import React from 'react';
import { Shield, Smartphone, Globe, Eye, Activity, Radio } from 'lucide-react';

export default function Header({
  activeTab = 'live',
  setActiveTab = null,
  easyMode = false,
  setEasyMode = null,
  language = 'en',
  setLanguage = null,
  onOpenMobileView = null,
  onOpenPrivacyCenter = null,
  onOpenKnowledgeBase = null,
  onOpenEvaluation = null,
  onOpenReport = null,
  onOpenAudit = null
}) {
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'ml', label: 'മലയാളം (Malayalam)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  ];

  return (
    <header style={{
      borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
      background: 'rgba(7, 11, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      padding: '12px 24px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
        {/* Brand identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.45)'
          }}>
            <Shield size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                SILENT WITNESS
              </h1>
              <span className="badge badge-safe" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                <span className="radar-dot" style={{ width: '6px', height: '6px' }} />
                ACTIVE SAFETY
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              "Don't trust the voice. Verify the conversation."
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav style={{ display: 'flex', gap: '6px', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <button
            onClick={() => setActiveTab('live')}
            className={activeTab === 'live' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '7px 12px', fontSize: '0.82rem' }}
          >
            <Radio size={14} /> Live Call
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '7px 12px', fontSize: '0.82rem' }}
          >
            Upload Audio
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={activeTab === 'demo' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '7px 12px', fontSize: '0.82rem' }}
          >
            Scam Demos
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '7px 12px', fontSize: '0.82rem' }}
          >
            History
          </button>
        </nav>

        {/* Subsystem Tool Modals & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Scam Knowledge Base */}
          <button
            onClick={onOpenKnowledgeBase}
            className="btn-secondary"
            style={{ padding: '7px 10px', fontSize: '0.78rem' }}
            title="Browse 17 Scam Categories & Attack Vectors"
          >
            📚 Knowledge Base
          </button>

          {/* Evaluation Dashboard */}
          <button
            onClick={onOpenEvaluation}
            className="btn-secondary"
            style={{ padding: '7px 10px', fontSize: '0.78rem' }}
            title="View Real Empirical Model Metrics & Latencies"
          >
            📊 Evaluation
          </button>

          {/* Tamper-Evident Audit Ledger */}
          <button
            onClick={onOpenAudit}
            className="btn-secondary"
            style={{ padding: '7px 10px', fontSize: '0.78rem' }}
            title="Inspect Cryptographic SHA-256 Tamper-Evident Audit Chain"
          >
            ⛓️ Audit Ledger
          </button>

          {/* Privacy Center */}
          <button
            onClick={onOpenPrivacyCenter}
            className="btn-secondary"
            style={{ padding: '7px 10px', fontSize: '0.78rem' }}
            title="Privacy Center & Data Wipe Controls"
          >
            🔒 Privacy
          </button>

          {/* Mobile phone simulation toggle */}
          <button
            onClick={onOpenMobileView}
            className="btn-secondary"
            style={{ padding: '7px 10px', fontSize: '0.78rem' }}
            title="Open Mobile Call Simulation Overlay"
          >
            <Smartphone size={14} /> Mobile
          </button>

          {/* Easy Mode toggle */}
          <button
            onClick={() => setEasyMode(!easyMode)}
            style={{
              padding: '7px 11px',
              borderRadius: '10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              border: easyMode ? '2px solid #34d399' : '1px solid var(--border-glass)',
              background: easyMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.7)',
              color: easyMode ? '#34d399' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            <Eye size={14} /> {easyMode ? 'Easy ON' : 'Easy Mode'}
          </button>
        </div>
      </div>
    </header>
  );
}
