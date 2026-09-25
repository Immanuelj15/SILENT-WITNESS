import React from 'react';
import { PhoneOff, ShieldAlert, CheckCircle2, AlertTriangle, AlertOctagon, ArrowRight } from 'lucide-react';

export default function ActionCard({
  recommendation = '',
  actions = [],
  easyModeSummary = '',
  riskScore = 0,
  onEndCall = null,
  easyMode = false,
}) {
  const getSeverity = () => {
    if (riskScore >= 75) {
      return {
        level: 'CRITICAL',
        title: 'Stop and verify',
        description: 'End the conversation immediately and contact the organization using an official channel.',
        badgeClass: 'badge-danger',
        borderColor: 'var(--critical)',
        bg: 'var(--critical-bg)',
        icon: <AlertOctagon size={22} style={{ color: 'var(--critical)' }} />,
      };
    }
    if (riskScore >= 50) {
      return {
        level: 'HIGH',
        title: 'High-risk conversation',
        description: 'Do not share OTP, PIN, passwords, or financial information.',
        badgeClass: 'badge-danger',
        borderColor: 'var(--danger)',
        bg: 'var(--danger-bg)',
        icon: <AlertTriangle size={22} style={{ color: 'var(--danger)' }} />,
      };
    }
    if (riskScore >= 25) {
      return {
        level: 'MEDIUM',
        title: 'Be cautious',
        description: 'Avoid sharing sensitive personal or financial information.',
        badgeClass: 'badge-warning',
        borderColor: 'var(--warning)',
        bg: 'var(--warning-bg)',
        icon: <AlertTriangle size={22} style={{ color: 'var(--warning)' }} />,
      };
    }
    return {
      level: 'LOW',
      title: 'Conversation appears safe',
      description: 'Continue normally. Silent Witness continues standing guard in the background.',
      badgeClass: 'badge-success',
      borderColor: 'var(--success)',
      bg: 'var(--success-bg)',
      icon: <CheckCircle2 size={22} style={{ color: 'var(--success)' }} />,
    };
  };

  const severity = getSeverity();

  return (
    <div
      className="sw-card"
      style={{
        padding: '20px 24px',
        borderLeft: `4px solid ${severity.borderColor}`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {severity.icon}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
              RECOMMENDED SAFETY ACTION
            </div>
            <h4 style={{ fontSize: easyMode ? '19px' : '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {severity.title}
            </h4>
          </div>
        </div>

        <span className={`badge ${severity.badgeClass}`}>
          {severity.level}
        </span>
      </div>

      {/* Main Guidance Text */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: severity.bg,
          border: `1px solid ${severity.borderColor}40`,
          fontSize: easyMode ? '16px' : '13px',
          color: 'var(--text-primary)',
          fontWeight: 500,
          lineHeight: 1.5,
          marginBottom: '16px',
        }}
      >
        {easyModeSummary || severity.description}
      </div>

      {/* Action Bullets if available */}
      {actions && actions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
          {actions.map((act, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: severity.borderColor }} />
              <span>{act}</span>
            </div>
          ))}
        </div>
      )}

      {/* Emergency Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        {onEndCall && (
          <button
            onClick={onEndCall}
            className={riskScore >= 50 ? 'btn-danger' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <PhoneOff size={15} />
            <span>End Active Call</span>
          </button>
        )}
      </div>
    </div>
  );
}
