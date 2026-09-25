import React, { useRef, useEffect, useState } from 'react';
import { MessageSquare, PhoneCall, User, ShieldAlert, AlertTriangle, ShieldCheck, ListFilter } from 'lucide-react';

export default function LiveTranscript({
  transcript = '',
  dialogueTurns = [],
  evidence = [],
  suspiciousPhrases = [],
  isProvisional = false,
  easyMode = false,
}) {
  const scrollRef = useRef(null);
  const [viewMode, setViewMode] = useState('chat'); // 'chat' or 'plain'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, dialogueTurns]);

  // Turn raw transcript text into dialogue items if dialogueTurns is not provided
  const turns = (dialogueTurns && dialogueTurns.length > 0)
    ? dialogueTurns
    : transcript
      ? [
          {
            speaker: 'CALLER',
            text: transcript,
            timestamp_offset: 0,
          },
        ]
      : [];

  const getTurnSecurityAlert = (turnText) => {
    if (!turnText) return null;
    const lower = turnText.toLowerCase();

    if (lower.includes('otp') || lower.includes('pin') || lower.includes('password') || lower.includes('cvv')) {
      return {
        severity: 'danger',
        label: 'Sensitive credential request detected',
        border: 'var(--danger)',
      };
    }
    if (lower.includes('screen') && (lower.includes('share') || lower.includes('anydesk') || lower.includes('teamviewer'))) {
      return {
        severity: 'critical',
        label: 'Screen sharing / remote access coercion detected',
        border: 'var(--critical)',
      };
    }
    if (lower.includes('bank') || lower.includes('police') || lower.includes('customs') || lower.includes('arrest') || lower.includes('blocked')) {
      return {
        severity: 'warning',
        label: 'Authority / urgency impersonation signal detected',
        border: 'var(--warning)',
      };
    }
    return null;
  };

  return (
    <div className="sw-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <MessageSquare size={16} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Live Conversation Transcript
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Real-time speaker diarization with inline AI fraud annotation
            </div>
          </div>
        </div>

        <button
          onClick={() => setViewMode(viewMode === 'chat' ? 'plain' : 'chat')}
          className="btn-ghost"
          style={{ fontSize: '12px', padding: '4px 8px' }}
        >
          <ListFilter size={13} />
          <span>{viewMode === 'chat' ? 'Chat View' : 'Raw Text'}</span>
        </button>
      </div>

      {/* Main Transcript Body */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: '220px',
          maxHeight: '340px',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-main)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {turns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
            <p style={{ fontWeight: 500 }}>Standing by for speech input...</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>
              Spoken conversation turns and detected intent patterns will appear here in real time.
            </p>
          </div>
        ) : (
          turns.map((turn, idx) => {
            const isCaller = turn.speaker === 'CALLER' || !turn.speaker;
            const alert = isCaller ? getTurnSecurityAlert(turn.text) : null;
            const borderColor = alert ? alert.border : isCaller ? 'var(--primary)' : 'var(--success)';

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  backgroundColor: 'var(--surface)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  borderLeft: `4px solid ${borderColor}`,
                  padding: '12px 14px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Speaker Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isCaller ? (
                      <PhoneCall size={13} style={{ color: 'var(--primary)' }} />
                    ) : (
                      <User size={13} style={{ color: 'var(--success)' }} />
                    )}
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: isCaller ? 'var(--primary)' : 'var(--success)' }}>
                      {isCaller ? 'INBOUND CALLER' : 'YOU (USER)'}
                    </span>
                  </div>
                  {turn.timestamp_offset != null && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      +{turn.timestamp_offset}s
                    </span>
                  )}
                </div>

                {/* Spoken Utterance */}
                <div style={{ fontSize: easyMode ? '16px' : '13.5px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  "{turn.text}"
                </div>

                {/* Inline Silent Witness AI Flag if suspicious */}
                {alert && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '4px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: alert.severity === 'danger' ? 'var(--danger-bg)' : alert.severity === 'critical' ? 'var(--critical-bg)' : 'var(--warning-bg)',
                      border: `1px solid ${alert.severity === 'danger' ? 'var(--danger-border)' : 'var(--warning-border)'}`,
                      fontSize: '11px',
                      fontWeight: 600,
                      color: alert.severity === 'danger' ? 'var(--danger-text)' : 'var(--warning-text)',
                    }}
                  >
                    <AlertTriangle size={12} />
                    <span>SILENT WITNESS: {alert.label}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--primary)' }} />
          <span>Normal Speech</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--warning)' }} />
          <span>Suspicious Impersonation</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--danger)' }} />
          <span>Credential Demands</span>
        </div>
      </div>
    </div>
  );
}
