import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, PhoneOff, CheckCircle2 } from 'lucide-react';

export default function EasyModeView({ trustScore = 100, riskScore = 0, onEndCall }) {
  const getEasyState = () => {
    if (riskScore >= 60 || trustScore < 40) {
      return {
        label: 'STOP',
        headline: 'Potential scam detected!',
        message: 'Do NOT share any bank codes, OTPs, or passwords. Do not send money.',
        color: 'var(--critical)',
        bg: 'var(--critical-bg)',
        border: 'var(--critical)',
        icon: <AlertOctagon size={64} style={{ color: 'var(--critical)' }} />,
        actionText: 'HANG UP CALL NOW',
      };
    }
    if (riskScore >= 25 || trustScore < 75) {
      return {
        label: 'BE CAREFUL',
        headline: 'This conversation contains suspicious signals.',
        message: 'Avoid sharing sensitive details. The caller cannot be officially verified.',
        color: 'var(--warning-text)',
        bg: 'var(--warning-bg)',
        border: 'var(--warning)',
        icon: <AlertTriangle size={64} style={{ color: 'var(--warning)' }} />,
        actionText: 'HANG UP IF UNSURE',
      };
    }
    return {
      label: 'SAFE',
      headline: 'Conversation appears normal.',
      message: 'Silent Witness is standing guard. No scam signatures detected.',
      color: 'var(--success-text)',
      bg: 'var(--success-bg)',
      border: 'var(--success)',
      icon: <CheckCircle2 size={64} style={{ color: 'var(--success)' }} />,
      actionText: 'END CALL',
    };
  };

  const state = getEasyState();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '65vh',
        maxWidth: '680px',
        margin: '0 auto',
        textAlign: 'center',
        gap: '24px',
      }}
    >
      <div
        className="sw-card"
        style={{
          width: '100%',
          padding: '48px 32px',
          border: `3px solid ${state.border}`,
          backgroundColor: state.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div>{state.icon}</div>

        <div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 900,
              color: state.color,
              letterSpacing: '0.04em',
              marginBottom: '8px',
            }}
          >
            {state.label}
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {state.headline}
          </h3>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '480px' }}>
            {state.message}
          </p>
        </div>

        {onEndCall && (
          <button
            onClick={onEndCall}
            className="btn-danger"
            style={{
              marginTop: '16px',
              padding: '16px 36px',
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '0.03em',
              borderRadius: '12px',
            }}
          >
            <PhoneOff size={22} />
            <span>{state.actionText}</span>
          </button>
        )}
      </div>

      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        Simple Senior-Friendly Safety Mode • No complex technical terms
      </div>
    </div>
  );
}
