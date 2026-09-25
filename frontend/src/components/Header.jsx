import React from 'react';
import {
  Search,
  Bell,
  User,
  Shield,
  Menu,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  Globe,
  Radio,
  Sparkles
} from 'lucide-react';

export default function Header({
  activeTab,
  easyMode,
  setEasyMode,
  language,
  setLanguage,
  isRecording,
  onMenuToggle,
}) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Executive Overview', breadcrumb: 'Command Center / Global Telemetry' };
      case 'live':
        return { title: 'Live Voice & Screen Shield', breadcrumb: 'Active Operations / Real-Time Defense' };
      case 'history':
        return { title: 'Call Protection History', breadcrumb: 'Audit Trail / Forensic Records' };
      case 'demos':
        return { title: 'Scam Scenario Sandbox', breadcrumb: 'Intelligence / Attack Simulations' };
      case 'intelligence':
        return { title: 'Threat Intelligence Playbooks', breadcrumb: 'Knowledge Base / Fraud Signatures' };
      case 'evaluation':
        return { title: 'Model Evaluation Benchmarks', breadcrumb: 'Empirical Verification / Metrics' };
      case 'ott':
        return { title: 'WhatsApp & VoIP Safety Layer', breadcrumb: 'OTT Calling / Screen-Share Defense' };
      case 'privacy':
        return { title: 'Privacy & Data Governance', breadcrumb: 'Compliance / Zero-Storage Controls' };
      case 'audit':
        return { title: 'Cryptographic Audit Trail', breadcrumb: 'Forensics / SHA-256 Ledger' };
      case 'capabilities':
        return { title: 'Platform Capabilities Matrix', breadcrumb: 'Architecture / Channel Sandboxing' };
      case 'settings':
        return { title: 'System Administration', breadcrumb: 'Configuration / Safety Parameters' };
      default:
        return { title: 'Command Center', breadcrumb: 'Dashboard' };
    }
  };

  const { title, breadcrumb } = getTabTitle();

  return (
    <header className="app-header">
      {/* Left: Mobile Drawer Trigger + Breadcrumb + Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onMenuToggle}
          className="btn-ghost"
          style={{ padding: '6px', display: 'none' }}
          id="mobile-menu-btn"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '-0.01em' }}>
            {breadcrumb}
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Search, Global Live Status, Controls & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Search Input with ⌘K Badge */}
        <div style={{ position: 'relative', width: '240px' }} className="desktop-search">
          <Search size={14} style={{ position: 'absolute', left: '11px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search threats, calls..."
            className="sw-input"
            style={{ paddingLeft: '32px', paddingRight: '48px', height: '34px', fontSize: '12.5px', borderRadius: '8px' }}
          />
          <span
            style={{
              position: 'absolute',
              right: '8px',
              top: '7px',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 5px',
              borderRadius: '4px',
              backgroundColor: '#F1F5F9',
              color: '#64748B',
              border: '1px solid #E2E8F0',
              fontFamily: 'monospace',
            }}
          >
            ⌘K
          </span>
        </div>

        {/* Live Defense Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '5px 11px',
            borderRadius: '999px',
            backgroundColor: isRecording ? 'var(--warning-bg)' : 'var(--success-bg)',
            border: `1px solid ${isRecording ? 'var(--warning-border)' : 'var(--success-border)'}`,
            fontSize: '12px',
            fontWeight: 700,
            color: isRecording ? 'var(--warning-text)' : 'var(--success-text)',
            letterSpacing: '-0.01em',
          }}
        >
          <span className={`status-dot ${isRecording ? 'status-dot-warning' : 'status-dot-active'}`} />
          <span>{isRecording ? 'Call In Progress' : 'Protection Active'}</span>
        </div>

        {/* Simple Mode Toggle */}
        <button
          onClick={() => setEasyMode(!easyMode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: easyMode ? 'var(--primary)' : 'var(--surface)',
            color: easyMode ? '#FFFFFF' : 'var(--text-secondary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Toggle High-Contrast Senior Accessibility Mode"
        >
          <SlidersHorizontal size={13} />
          <span>{easyMode ? 'Simple View: ON' : 'Simple View'}</span>
        </button>

        {/* Language Selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            padding: '6px 9px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="en">English (US)</option>
          <option value="ta">தமிழ் (Tamil)</option>
          <option value="hi">हिंदी (Hindi)</option>
        </select>

        {/* User Profile Avatar */}
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
            border: '1.5px solid #BFDBFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            fontWeight: 800,
            fontSize: '12px',
            letterSpacing: '0.04em',
            boxShadow: 'var(--shadow-xs)',
          }}
          title="Enterprise Security Administrator"
        >
          SA
        </div>
      </div>
    </header>
  );
}
