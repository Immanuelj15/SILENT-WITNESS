import React, { useState, useEffect } from 'react';
import {
  Shield,
  PhoneCall,
  ShieldAlert,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Radio,
  ExternalLink,
  Smartphone,
  Sparkles,
  Lock,
  UserCheck,
  Activity,
  FileCheck,
  ChevronRight,
  Zap,
  Play,
  Share2,
  Layers,
  Check,
  AlertCircle
} from 'lucide-react';
import apiClient from '../utils/apiClient';

export default function DashboardOverview({
  currentAnalysis,
  isRecording,
  callDuration,
  onNavigateToLive,
  onNavigateToOTT,
  onNavigateToDemos,
  onRunScenario,
  selectedChannel,
}) {
  const [stats, setStats] = useState({
    totalCalls: 128,
    threatsDetected: 14,
    highRiskThreats: 3,
    avgTrustScore: 82,
    protectionTimeHours: 18,
    protectionTimeMinutes: 42,
  });

  const [sessionFilter, setSessionFilter] = useState('ALL');

  useEffect(() => {
    apiClient.get('/api/stats')
      .then((data) => {
        if (data && typeof data === 'object') {
          setStats((prev) => ({
            ...prev,
            totalCalls: data.total_calls ?? prev.totalCalls,
            threatsDetected: data.scams_blocked ?? data.threats_detected ?? prev.threatsDetected,
            avgTrustScore: data.avg_trust_score ? Math.round(data.avg_trust_score) : prev.avgTrustScore,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const trustScore = currentAnalysis?.trustScore ?? 82;
  const isGuarded = trustScore < 85 && trustScore >= 50;
  const isDanger = trustScore < 50;

  // Recent detected threat stream
  const recentActivities = [
    {
      id: "SES-9821",
      time: "10:42 AM",
      caller: "Unknown Inbound Contact (+91 98765 43210)",
      channel: "WhatsApp",
      event: "OTP Credential Harvesting Intercepted",
      severity: "CRITICAL",
      score: 27,
      tag: "Bank KYC Impersonation",
      duration: "1m 14s",
      hash: "8f4a...2c91"
    },
    {
      id: "SES-9818",
      time: "09:15 AM",
      caller: "Dr. Ramesh (Family Contact)",
      channel: "WhatsApp Video",
      event: "Family Routine Check-In Call Verified",
      severity: "SAFE",
      score: 92,
      tag: "Verified Contact",
      duration: "4m 32s",
      hash: "1b9e...77fa"
    },
    {
      id: "SES-9799",
      time: "Yesterday, 04:30 PM",
      caller: "Courier Logistics (+91 80123 45678)",
      channel: "SIM Cellular",
      event: "Address Confirmation (Guarded Mode)",
      severity: "GUARDED",
      score: 68,
      tag: "Delivery Inquiry",
      duration: "0m 45s",
      hash: "d304...bb12"
    }
  ];

  const filteredActivities = recentActivities.filter(item => {
    if (sessionFilter === 'THREATS') return item.severity === 'CRITICAL' || item.severity === 'GUARDED';
    if (sessionFilter === 'SAFE') return item.severity === 'SAFE';
    return true;
  });

  // 1-Click Interactive Attack Scenarios
  const quickScenarios = [
    {
      title: "Bank KYC & Screen Share",
      category: "Banking Fraud",
      desc: "Poses as SBI fraud prevention, creates extreme urgency, demands OTP and asks victim to share screen.",
      risk: "CRITICAL",
      tag: "Screen Share",
      phrase: "Hello sir, calling from your bank SBI. Your account will be blocked within 1 hour due to KYC failure. Share the 6-digit OTP immediately and open WhatsApp screen share to verify your app."
    },
    {
      title: "Digital Arrest & Police Extortion",
      category: "Law Enforcement",
      desc: "Claims a customs narcotics parcel was registered in victim's name with an immediate non-bailable arrest warrant.",
      risk: "CRITICAL",
      tag: "Intimidation",
      phrase: "This is Mumbai Police Cyber Crime Cell. A FedEx courier under your Aadhaar number was seized containing 140 grams of MDMA. You are under digital arrest and cannot hang up this call."
    },
    {
      title: "AI Voice Clone Distress Call",
      category: "Deepfake Voice",
      desc: "Synthetic distress clone of a family member pleading for emergency bail transfer after an alleged accident.",
      risk: "HIGH",
      tag: "Voice Deepfake",
      phrase: "Dad, it's me! I was in a terrible car accident with a friend and police arrested us. I need 50,000 rupees bail money right now, please send it to this officer's UPI ID."
    },
    {
      title: "Legitimate Courier Confirmation",
      category: "Legitimate Baseline",
      desc: "Authentic parcel courier calling to verify the recipient is home for physical delivery.",
      risk: "SAFE",
      tag: "Normal Call",
      phrase: "Hello, this is Blue Dart courier service. I have a book package for your address. Are you available today to receive the parcel?"
    }
  ];

  const handleLaunchScenario = (phrase) => {
    if (onRunScenario) {
      onRunScenario(phrase);
    } else if (onNavigateToLive) {
      onNavigateToLive();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* 1. Executive Telemetry Top Bar (High-Contrast Slate Banner) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 70%, #1E3A8A 130%)',
          borderRadius: '16px',
          padding: '28px 32px',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.25)',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #334155',
        }}
      >
        {/* Subtle Decorative Ambient Blue Light */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-40px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.3) 0%, rgba(37, 99, 235, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '780px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#93C5FD',
                  backgroundColor: 'rgba(37, 99, 235, 0.25)',
                  border: '1px solid rgba(96, 165, 250, 0.4)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                }}
              >
                <Shield size={13} />
                <span>Enterprise Telephony Shield</span>
              </span>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#34D399',
                  backgroundColor: 'rgba(16, 185, 129, 0.18)',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  padding: '3px 9px',
                  borderRadius: '999px',
                }}
              >
                <CheckCircle2 size={12} />
                <span>Zero-Trust Acoustic Layer Ready</span>
              </span>
            </div>

            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.025em', marginBottom: '6px' }}>
              Universal Conversational Fraud Interception
            </h2>

            <p style={{ fontSize: '14px', color: '#CBD5E1', lineHeight: 1.55, marginBottom: '16px' }}>
              “Don’t trust the voice. Verify the conversation.” Real-time acoustic deepfake verification, multi-agent conversational intent reasoning, and screen-sharing interception across SIM, WhatsApp, Telegram, and VoIP calls.
            </p>

            {/* Live Telemetry Health Strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#94A3B8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="status-dot status-dot-active" style={{ boxShadow: '0 0 6px #10B981' }} />
                <span>Neural Voice Authenticator: <strong style={{ color: '#F1F5F9' }}>12ms latency</strong></span>
              </div>
              <span>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="status-dot status-dot-active" style={{ boxShadow: '0 0 6px #10B981' }} />
                <span>Intent Progression Engine: <strong style={{ color: '#F1F5F9' }}>Armed</strong></span>
              </div>
              <span>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="status-dot status-dot-active" style={{ boxShadow: '0 0 6px #10B981' }} />
                <span>Screen-Sharing Intercept: <strong style={{ color: '#F1F5F9' }}>Fast-Path Armed</strong></span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '220px' }}>
            <button
              onClick={onNavigateToLive}
              style={{
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13.5px',
                borderRadius: '10px',
                padding: '12px 20px',
                border: '1px solid #3B82F6',
                boxShadow: '0 0 16px rgba(37, 99, 235, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
            >
              <Radio size={16} />
              <span>Launch Live Call Monitor</span>
            </button>

            <button
              onClick={onNavigateToOTT}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#F8FAFC',
                fontWeight: 600,
                fontSize: '13px',
                borderRadius: '10px',
                padding: '10px 18px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
            >
              <Smartphone size={15} />
              <span>WhatsApp / VoIP Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Four Polished KPI Cards with Trend Indicators & Sparklines */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        {/* KPI 1 */}
        <div className="sw-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="sw-kpi-title">Protected Inbound Calls</span>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #DBEAFE',
              }}
            >
              <PhoneCall size={18} />
            </div>
          </div>
          <div className="sw-kpi-value">{stats.totalCalls}</div>
          <div className="sw-kpi-sub" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: 'var(--success)', fontWeight: 800 }}>+12%</span>
              <span>vs previous 7d</span>
            </div>
            {/* SVG Sparkline */}
            <svg width="56" height="20" viewBox="0 0 56 20" fill="none">
              <path d="M2 16L14 12L26 15L38 7L54 3" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
            SIM: <strong>84</strong> • WhatsApp: <strong>32</strong> • VoIP: <strong>12</strong>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="sw-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="sw-kpi-title">Threats Neutralized</span>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #FECACA',
              }}
            >
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="sw-kpi-value">{stats.threatsDetected}</div>
          <div className="sw-kpi-sub" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: 'var(--danger)', fontWeight: 800 }}>{stats.highRiskThreats} Critical</span>
              <span>intercepted</span>
            </div>
            {/* Red Threat Spike Sparkline */}
            <svg width="56" height="20" viewBox="0 0 56 20" fill="none">
              <path d="M2 17L14 15L24 16L34 5L54 2" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
            100% Intercept Precision • 0 Leaks
          </div>
        </div>

        {/* KPI 3 */}
        <div className="sw-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="sw-kpi-title">Fleet Trust Health</span>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#F0FDF4',
                color: '#15803D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #BBF7D0',
              }}
            >
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="sw-kpi-value">
            {stats.avgTrustScore} <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 600 }}>/ 100</span>
          </div>
          <div className="sw-kpi-sub" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: 'var(--success)', fontWeight: 800 }}>+4.2 pts</span>
              <span>healthy fleet</span>
            </div>
            {/* Rising Blue Sparkline */}
            <svg width="56" height="20" viewBox="0 0 56 20" fill="none">
              <path d="M2 15L14 12L28 9L40 6L54 2" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
            Nominal Security Tier • Low Exposure
          </div>
        </div>

        {/* KPI 4 */}
        <div className="sw-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="sw-kpi-title">Protected Guard Time</span>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#F1F5F9',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #E2E8F0',
              }}
            >
              <Clock size={18} />
            </div>
          </div>
          <div className="sw-kpi-value">{stats.protectionTimeHours}h {stats.protectionTimeMinutes}m</div>
          <div className="sw-kpi-sub" style={{ justifyContent: 'space-between' }}>
            <span>99.98% Telephony Uptime</span>
            {/* 24-hr Activity Heat-bar */}
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              {[...Array(12)].map((_, i) => (
                <div key={i} style={{ width: '3px', height: '10px', backgroundColor: '#10B981', borderRadius: '1px' }} />
              ))}
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
            Zero Audio Storage • Ephemeral Stream
          </div>
        </div>
      </div>

      {/* 3. Primary Section: Active Live Call Protection Card */}
      <div
        className="sw-card"
        style={{
          padding: '24px 28px',
          borderLeft: `5px solid ${isDanger ? 'var(--danger)' : isGuarded ? 'var(--warning)' : '#2563EB'}`,
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '22px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '8px' }}>
              <span className={`status-dot ${isRecording ? 'status-dot-warning' : 'status-dot-active'}`} style={{ width: '8px', height: '8px' }} />
              <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                ACTIVE TELEPHONY DEFENSE:
              </span>
              <span className={`badge ${isDanger ? 'badge-danger' : isGuarded ? 'badge-warning' : 'badge-primary'}`}>
                {isDanger ? 'CRITICAL THREAT DETECTED' : isGuarded ? 'GUARDED & ARMED' : 'ARMED & READY'}
              </span>
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '5px', letterSpacing: '-0.02em' }}>
              {isRecording ? 'Active Spoken Call Being Monitored in Real-Time' : 'Standing Guard — Telephony Pipeline Ready for Inbound Calls'}
            </h3>

            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Channel: <strong style={{ color: 'var(--text-primary)' }}>{selectedChannel || 'SIM Cellular (VoLTE)'}</strong> • Monitored Inbound: <strong style={{ color: 'var(--text-primary)' }}>Unknown Inbound Contact (+91 98765 43210)</strong> • Risk Tier: <span className="badge badge-warning" style={{ fontSize: '10px', padding: '1px 6px' }}>UNKNOWN NUMBER</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CURRENT TRUST SCORE
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
                <span style={{ fontSize: '36px', fontWeight: 900, color: isDanger ? 'var(--danger)' : isGuarded ? 'var(--warning)' : '#2563EB', lineHeight: 1 }}>
                  {trustScore}
                </span>
                <span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>/ 100</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                88% Neural Certainty
              </div>
            </div>

            <button onClick={onNavigateToLive} className="btn-primary" style={{ padding: '11px 20px', fontSize: '13.5px', gap: '8px' }}>
              <span>Open Live Analysis</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Real-Time Defense Signals Grid (4 Diagnostic Pillars) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '16px 20px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>VOICE AUTHENTICITY</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="status-dot status-dot-active" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Natural Human Voice</span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Jitter 0.42% • Synthetic prob: 2.1%</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>CALLER IDENTITY AUDIT</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="status-dot status-dot-warning" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Unverified Inbound</span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>No Telecom Registry Match</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>SCREEN SHARING DEFENSE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="status-dot status-dot-active" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Fast-Path Armed</span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Kernel/Accessibility Intercept Ready</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>CONVERSATIONAL INTENT</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="status-dot status-dot-active" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Nominal Baseline</span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Zero coercion or credential flags</div>
          </div>
        </div>
      </div>

      {/* 4. Multi-Channel Telephony Defense Status Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>SIM Cellular (VoLTE)</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Native Carrier Stream</div>
          </div>
          <span className="badge badge-success" style={{ fontSize: '10px' }}>Active</span>
        </div>

        <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>WhatsApp Calling</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Screen-Share Fast Path</div>
          </div>
          <span className="badge badge-success" style={{ fontSize: '10px' }}>Active</span>
        </div>

        <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>Telegram VoIP</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Deepfake Voice Scanner</div>
          </div>
          <span className="badge badge-success" style={{ fontSize: '10px' }}>Active</span>
        </div>

        <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>WebRTC In-App</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>12ms WebSocket Stream</div>
          </div>
          <span className="badge badge-success" style={{ fontSize: '10px' }}>Active</span>
        </div>
      </div>

      {/* 5. Bottom 2-Column Section: Real-Time Forensic Stream vs Interactive Attack Sandbox */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '20px' }}>
        {/* Left Column: Recent Detected Threat Stream */}
        <div className="sw-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Recent Screened Telephony Sessions
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Cryptographic audit trail of recent call verifications
              </p>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
              {['ALL', 'THREATS', 'SAFE'].map((f) => (
                <button
                  key={f}
                  onClick={() => setSessionFilter(f)}
                  style={{
                    border: 'none',
                    backgroundColor: sessionFilter === f ? '#FFFFFF' : 'transparent',
                    color: sessionFilter === f ? '#0F172A' : '#64748B',
                    fontWeight: sessionFilter === f ? 700 : 500,
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: sessionFilter === f ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {f === 'ALL' ? 'All (3)' : f === 'THREATS' ? 'Threats (2)' : 'Safe (1)'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ minWidth: 0, flex: 1, marginRight: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>{act.caller}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: '#E2E8F0', color: '#475569' }}>
                      {act.channel}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: act.severity === 'CRITICAL' ? '#FEE2E2' : act.severity === 'GUARDED' ? '#FEF3C7' : '#DCFCE7',
                        color: act.severity === 'CRITICAL' ? '#DC2626' : act.severity === 'GUARDED' ? '#D97706' : '#15803D',
                      }}
                    >
                      {act.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                    {act.event} • <span style={{ color: 'var(--text-muted)' }}>{act.time} ({act.duration})</span> • <code style={{ fontSize: '10px', color: '#94A3B8' }}>{act.hash}</code>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span
                    className={`badge ${act.severity === 'CRITICAL' ? 'badge-danger' : act.severity === 'GUARDED' ? 'badge-warning' : 'badge-success'}`}
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                  >
                    {act.score} / 100
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive 1-Click Simulation Sandbox */}
        <div className="sw-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                1-Click Threat Simulation Sandbox
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Test multi-agent fraud detection against real-world attack playbooks
              </p>
            </div>
            <button onClick={onNavigateToDemos} className="btn-ghost" style={{ fontSize: '12px', padding: '4px 8px', color: 'var(--primary)' }}>
              <span>View Library</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {quickScenarios.map((scen, idx) => (
              <div
                key={idx}
                onClick={() => handleLaunchScenario(scen.phrase)}
                className="sw-card-interactive"
                style={{
                  padding: '13px 16px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{scen.title}</span>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '1px 5.5px',
                        borderRadius: '4px',
                        backgroundColor: scen.risk === 'CRITICAL' ? '#FEE2E2' : scen.risk === 'HIGH' ? '#FEF3C7' : '#DCFCE7',
                        color: scen.risk === 'CRITICAL' ? '#DC2626' : scen.risk === 'HIGH' ? '#D97706' : '#15803D',
                      }}
                    >
                      {scen.risk}
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {scen.desc}
                  </div>
                </div>

                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#EFF6FF',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid #DBEAFE',
                  }}
                  title="Run simulation immediately"
                >
                  <Play size={13} fill="var(--primary)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
