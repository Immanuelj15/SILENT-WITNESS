import React from 'react';
import { PhoneOff, ShieldAlert, CheckCircle, ExternalLink, AlertOctagon } from 'lucide-react';

export default function ActionCard({ recommendation = '', actions = [], easyModeSummary = '', riskScore = 0, onEndCall = null, easyMode = false }) {
  const isHighDanger = riskScore > 60;
  const isSuspicious = riskScore > 30 && riskScore <= 60;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '22px',
        border: isHighDanger ? '1px solid rgba(239, 68, 68, 0.4)' : isSuspicious ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-glass)',
        boxShadow: isHighDanger ? '0 0 35px rgba(239, 68, 68, 0.25)' : 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        {isHighDanger ? <AlertOctagon size={20} color="#ef4444" /> : <ShieldAlert size={20} color="#06b6d4" />}
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Recommended Safety Actions
        </span>
      </div>

      {/* Main Big Alert Banner */}
      <div style={{
        padding: '16px',
        borderRadius: '12px',
        background: isHighDanger ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.2) 100%)' : 'rgba(15, 23, 42, 0.7)',
        border: isHighDanger ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: easyMode ? '1.5rem' : '1.25rem',
          fontWeight: 800,
          color: isHighDanger ? '#fca5a5' : isSuspicious ? '#fde047' : '#86efac',
          letterSpacing: '0.04em',
          textTransform: 'uppercase'
        }}>
          {recommendation || 'CONVERSATION APPEARS SAFE'}
        </div>

        {/* Easy Mode Human-understandable Explanation */}
        <div style={{ fontSize: easyMode ? '1.15rem' : '0.92rem', color: '#f8fafc', marginTop: '6px', fontWeight: 500 }}>
          {easyModeSummary || 'No dangerous patterns detected. Continue call normally.'}
        </div>
      </div>

      {/* Action items list */}
      {actions && actions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
          {actions.map((act, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                fontSize: easyMode ? '1.05rem' : '0.88rem',
                fontWeight: 600,
                color: isHighDanger ? '#fecaca' : '#cbd5e1'
              }}
            >
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isHighDanger ? '#ef4444' : '#06b6d4' }} />
              {act}
            </div>
          ))}
        </div>
      )}

      {/* Quick Action Emergency Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: onEndCall ? '1fr 1fr' : '1fr', gap: '10px' }}>
        {onEndCall && (
          <button
            onClick={onEndCall}
            className="btn-danger"
            style={{ width: '100%', fontSize: easyMode ? '1.15rem' : '0.92rem' }}
          >
            <PhoneOff size={18} />
            END CALL NOW
          </button>
        )}
        <a
          href="https://cybercrime.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', fontSize: easyMode ? '1.05rem' : '0.88rem' }}
        >
          <ExternalLink size={16} />
          Official Verification Portal
        </a>
      </div>
    </div>
  );
}
