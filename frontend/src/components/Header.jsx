import React from 'react';
import { Shield, Smartphone, Globe, Eye, Activity, Radio } from 'lucide-react';

export default function Header({
  activeTab = 'live',
  setActiveTab = null,
  easyMode = false,
  setEasyMode = null,
  language = 'en',
  setLanguage = null,
  onOpenMobileView = null
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
      padding: '14px 24px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        {/* Brand identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.45)'
          }}>
            <Shield size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                SILENT WITNESS
              </h1>
              <span className="badge badge-safe" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                <span className="radar-dot" style={{ width: '6px', height: '6px' }} />
                ACTIVE
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              "Don't trust the voice. Verify the conversation."
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <button
            onClick={() => setActiveTab('live')}
            className={activeTab === 'live' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 14px', fontSize: '0.84rem' }}
          >
            <Radio size={15} /> Live Call
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 14px', fontSize: '0.84rem' }}
          >
            Upload Audio
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={activeTab === 'demo' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 14px', fontSize: '0.84rem' }}
          >
            Bank Scam Demo
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 14px', fontSize: '0.84rem' }}
          >
            Call History
          </button>
        </nav>

        {/* Action Controls & Accessibility */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Mobile phone simulation toggle */}
          <button
            onClick={onOpenMobileView}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            title="Open Mobile Call Simulation Overlay"
          >
            <Smartphone size={16} /> Mobile Call View
          </button>

          {/* Easy Mode / Elderly Mode toggle */}
          <button
            onClick={() => setEasyMode(!easyMode)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: easyMode ? '2px solid #34d399' : '1px solid var(--border-glass)',
              background: easyMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.7)',
              color: easyMode ? '#34d399' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            <Eye size={15} /> {easyMode ? 'Easy Mode: ON' : 'Easy Mode'}
          </button>

          {/* Multilingual Selector */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Globe size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#f8fafc',
                border: '1px solid var(--border-glass)',
                borderRadius: '10px',
                padding: '8px 12px 8px 30px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code} style={{ background: '#0b1120', color: '#fff' }}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
