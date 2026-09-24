import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, ShieldX } from 'lucide-react';

export default function TrustScoreRing({ trustScore = 100, riskScore = 0, confidence = 0.85, isProvisional = false, easyMode = false }) {
  // Score clamped between 0 and 100
  const score = Math.max(0, Math.min(100, Math.round(trustScore)));
  const risk = Math.max(0, Math.min(100, Math.round(riskScore)));
  const confPct = Math.round(confidence * 100);

  // Determine color scheme based on score
  let strokeColor = '#10b981'; // Emerald Safe
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  let statusText = 'SAFE CONVERSATION';
  let StatusIcon = ShieldCheck;
  let statusBadgeClass = 'badge-safe';

  if (score < 30) {
    strokeColor = '#ef4444'; // Crimson Scam
    glowColor = 'rgba(239, 68, 68, 0.6)';
    statusText = 'LIKELY SCAM — DANGER';
    StatusIcon = ShieldX;
    statusBadgeClass = 'badge-danger';
  } else if (score < 60) {
    strokeColor = '#f59e0b'; // Amber Caution
    glowColor = 'rgba(245, 158, 11, 0.5)';
    statusText = 'HIGH RISK — SUSPICIOUS';
    StatusIcon = ShieldAlert;
    statusBadgeClass = 'badge-danger';
  } else if (score < 80) {
    strokeColor = '#eab308'; // Yellow Caution
    glowColor = 'rgba(234, 179, 8, 0.4)';
    statusText = 'STAY ALERT — VERIFY';
    StatusIcon = AlertTriangle;
    statusBadgeClass = 'badge-warn';
  }

  // SVG parameters
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Live Trust Assessment
        </span>
        {isProvisional && (
          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
            PROVISIONAL
          </span>
        )}
      </div>

      {/* Trust Score Radial Meter */}
      <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 18px' }}>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="rgba(30, 41, 59, 0.8)"
            strokeWidth="14"
          />
          {/* Active progress stroke with glowing filter */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s ease',
              filter: `drop-shadow(0 0 10px ${glowColor})`
            }}
          />
        </svg>

        {/* Inner Score Label */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: easyMode ? '3.5rem' : '2.8rem', fontWeight: 800, color: strokeColor, lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.1em', marginTop: '4px' }}>
            TRUST SCORE
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            out of 100
          </span>
        </div>
      </div>

      {/* Main Status Badge */}
      <div style={{ marginBottom: '18px' }}>
        <div className={`badge ${statusBadgeClass}`} style={{ fontSize: easyMode ? '1.1rem' : '0.85rem', padding: '6px 16px' }}>
          <StatusIcon size={easyMode ? 22 : 16} />
          {statusText}
        </div>
      </div>

      {/* Distinct Risk vs. Confidence Gauges (Section 20 Principle) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        padding: '12px',
        background: 'rgba(10, 16, 30, 0.7)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <span>Fraud Risk</span>
            <span style={{ fontWeight: 700, color: risk > 60 ? '#ef4444' : risk > 30 ? '#f59e0b' : '#10b981' }}>{risk}/100</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${risk}%`, height: '100%', background: risk > 60 ? '#ef4444' : risk > 30 ? '#f59e0b' : '#10b981', transition: 'width 0.6s ease' }} />
          </div>
        </div>

        <div style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <span>Model Confidence</span>
            <span style={{ fontWeight: 700, color: '#38bdf8' }}>{confPct}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${confPct}%`, height: '100%', background: '#38bdf8', transition: 'width 0.6s ease' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
