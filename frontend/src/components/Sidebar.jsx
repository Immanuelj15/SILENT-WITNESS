import React from 'react';
import {
  Shield,
  Activity,
  PhoneCall,
  History,
  PlaySquare,
  BarChart2,
  Lock,
  FileCheck,
  Cpu,
  Settings,
  Smartphone,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Zap,
  Radio,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, easyMode, setEasyMode, isMobileOpen, setIsMobileOpen }) {
  const mainNavItems = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'live', label: 'Live Protection', icon: PhoneCall, badge: 'Active', badgeColor: 'bg-emerald-100 text-emerald-700' },
    { id: 'history', label: 'Call History', icon: History },
    { id: 'demos', label: 'Scam Demos', icon: PlaySquare },
    { id: 'intelligence', label: 'Knowledge Base', icon: BookOpen },
    { id: 'evaluation', label: 'AI Evaluation', icon: BarChart2 },
    { id: 'ott', label: 'WhatsApp & VoIP', icon: Smartphone, badge: 'OTT' },
  ];

  const securityNavItems = [
    { id: 'privacy', label: 'Privacy & Data', icon: Lock },
    { id: 'audit', label: 'Audit Ledger', icon: FileCheck },
    { id: 'capabilities', label: 'Capabilities', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelect = (id) => {
    setActiveTab(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <aside className={`app-sidebar ${isMobileOpen ? 'open' : ''}`}>
      {/* 1. Brand Logo Header */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)',
              flexShrink: 0,
            }}
          >
            <Shield size={22} strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                SILENT WITNESS
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '1.5px 5px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(37, 99, 235, 0.25)',
                  color: '#60A5FA',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  letterSpacing: '0.05em',
                }}
              >
                ENTERPRISE
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 500, letterSpacing: '-0.01em', marginTop: '1px' }}>
              AI Communication Security
            </div>
          </div>
        </div>
      </div>

      {/* 2. Scrollable Navigation */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
        }}
      >
        {/* Main Section */}
        <div>
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#64748B',
              padding: '0 12px 8px',
              letterSpacing: '0.08em',
            }}
          >
            Core Operations
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                    backgroundColor: isActive ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
                    color: isActive ? '#60A5FA' : '#94A3B8',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    boxShadow: isActive ? '0 0 12px rgba(37, 99, 235, 0.15)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = '#F8FAFC';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#94A3B8';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} strokeWidth={isActive ? 2.3 : 1.8} style={{ color: isActive ? '#60A5FA' : '#64748B' }} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '1.5px 6.5px',
                        borderRadius: '999px',
                        backgroundColor: item.id === 'live' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(37, 99, 235, 0.25)',
                        color: item.id === 'live' ? '#34D399' : '#93C5FD',
                        border: item.id === 'live' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(59, 130, 246, 0.3)',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Security & Controls Section */}
        <div>
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#64748B',
              padding: '0 12px 8px',
              letterSpacing: '0.08em',
            }}
          >
            Forensics & Governance
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {securityNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                    backgroundColor: isActive ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
                    color: isActive ? '#60A5FA' : '#94A3B8',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    boxShadow: isActive ? '0 0 12px rgba(37, 99, 235, 0.15)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = '#F8FAFC';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#94A3B8';
                    }
                  }}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.3 : 1.8} style={{ color: isActive ? '#60A5FA' : '#64748B' }} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Bottom Profile & System Health Card */}
      <div style={{ padding: '14px', borderTop: '1px solid #1E293B', backgroundColor: '#090D16' }}>
        <div
          style={{
            padding: '11px 12px',
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <span className="status-dot status-dot-active" style={{ boxShadow: '0 0 8px #10B981' }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.01em' }}>
                Protection Armed
              </div>
              <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>
                Neural Engine 12ms
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#34D399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              letterSpacing: '0.04em',
            }}
          >
            READY
          </span>
        </div>
      </div>
    </aside>
  );
}
