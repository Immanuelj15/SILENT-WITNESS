import React, { useState } from 'react';
import { GitCommit, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function IntentChain({ intentChain }) {
  const [selectedStage, setSelectedStage] = useState(null);

  // Standard 5-stage scam progression model
  const defaultStages = [
    { stage: 'IDENTITY_CLAIM', label: 'Identity Claim', detected: false, severity: 'LOW' },
    { stage: 'TRUST_BUILDING', label: 'Trust Building', detected: false, severity: 'LOW' },
    { stage: 'URGENCY', label: 'Urgency & Pressure', detected: false, severity: 'MEDIUM' },
    { stage: 'CREDENTIAL_REQUEST', label: 'Credential Request', detected: false, severity: 'HIGH' },
    { stage: 'PAYMENT_REQUEST', label: 'Payment / Coercion', detected: false, severity: 'CRITICAL' },
  ];

  // Merge detected stages from prop if available
  const stages = defaultStages.map((defaultStg) => {
    const match = intentChain?.stages?.find(
      (s) => (s.stage || '').toUpperCase() === defaultStg.stage
    );
    if (match) {
      return {
        ...defaultStg,
        detected: true,
        severity: match.severity || defaultStg.severity,
        explanation: match.explanation,
        evidenceSnippet: match.evidenceSnippet,
      };
    }
    return defaultStg;
  });

  const activeStage = selectedStage || stages.find((s) => s.detected) || stages[0];

  return (
    <div className="sw-card" style={{ padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <GitCommit size={16} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Scam Intent Progression Chain
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Multi-turn social-engineering progression and escalation path
            </div>
          </div>
        </div>

        {intentChain?.isFullAttackChain && (
          <span className="badge badge-danger">
            <ShieldAlert size={12} />
            <span>Full Attack Chain Identified</span>
          </span>
        )}
      </div>

      {/* Horizontal Chain Flow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
        }}
      >
        {stages.map((stg, idx) => {
          const isSelected = activeStage?.stage === stg.stage;
          const isDetected = stg.detected;
          const isDanger = stg.severity === 'CRITICAL' || stg.severity === 'HIGH';

          return (
            <React.Fragment key={stg.stage}>
              <div
                onClick={() => setSelectedStage(stg)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: isDetected
                    ? isDanger ? 'var(--danger-bg)' : 'var(--warning-bg)'
                    : 'var(--surface)',
                  color: isDetected
                    ? isDanger ? 'var(--danger-text)' : 'var(--warning-text)'
                    : 'var(--text-muted)',
                  cursor: 'pointer',
                  minWidth: '130px',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                  <span className={`status-dot ${isDetected ? (isDanger ? 'status-dot-danger' : 'status-dot-warning') : ''}`} style={{ backgroundColor: isDetected ? undefined : '#CBD5E1' }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                    Stage {idx + 1}
                  </span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>
                  {stg.label}
                </div>
              </div>

              {idx < stages.length - 1 && (
                <ArrowRight size={16} style={{ color: '#CBD5E1', flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Stage Detail Explanation */}
      {activeStage && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>{activeStage.label}: </strong>
          {activeStage.detected ? (
            <span>
              {activeStage.explanation || 'Signal detected in spoken conversation turns.'}
              {activeStage.evidenceSnippet && (
                <span style={{ fontStyle: 'italic', display: 'block', marginTop: '4px' }}>
                  Matched: "{activeStage.evidenceSnippet}"
                </span>
              )}
            </span>
          ) : (
            <span>No indicators detected for this stage yet in the current conversation.</span>
          )}
        </div>
      )}
    </div>
  );
}
