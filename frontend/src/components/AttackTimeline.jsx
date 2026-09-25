import React, { useState } from 'react';
import { Clock, ShieldAlert, AlertTriangle, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';

export default function AttackTimeline({ timeline = [] }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  // If empty timeline, show ready state or simulated progression
  const displayEvents = timeline && timeline.length > 0 ? timeline : [
    {
      timestamp: 0,
      timeFormatted: '00:02',
      event: 'Call connected',
      riskDelta: 0,
      runningRisk: 5,
      explanation: 'Inbound session initialized from unsaved contact.',
      sourceTurn: 'Hello? Can you hear me?',
    }
  ];

  const activeSelected = selectedEvent || displayEvents[displayEvents.length - 1];

  return (
    <div className="sw-card" style={{ padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Clock size={16} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Real-Time Attack Timeline
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Chronological turn-by-turn forensic progression with risk contribution
            </div>
          </div>
        </div>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: '999px',
            backgroundColor: 'var(--surface-alt)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          {displayEvents.length} {displayEvents.length === 1 ? 'Event' : 'Events'} Logged
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* Timeline Event List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
          {displayEvents.map((evt, idx) => {
            const isSelected = activeSelected && activeSelected.timestamp === evt.timestamp;
            const delta = evt.riskDelta ?? 0;
            const isHighRisk = delta >= 20 || (evt.runningRisk ?? 0) >= 60;

            return (
              <div
                key={idx}
                onClick={() => setSelectedEvent(evt)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Time Badge */}
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--surface-alt)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {evt.timeFormatted || `T+${Math.floor(evt.timestamp)}s`}
                </div>

                {/* Event Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {evt.event || 'Dialogue turn'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Total Risk: {evt.runningRisk ?? 0} / 100
                  </div>
                </div>

                {/* Risk Contribution Badge */}
                {delta > 0 && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isHighRisk ? 'var(--danger-bg)' : 'var(--warning-bg)',
                      color: isHighRisk ? 'var(--danger-text)' : 'var(--warning-text)',
                      border: `1px solid ${isHighRisk ? 'var(--danger-border)' : 'var(--warning-border)'}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    +{delta} risk
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Event Details Card */}
        {activeSelected && (
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Event Forensic Detail
            </div>

            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {activeSelected.event}
            </div>

            {activeSelected.sourceTurn && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', borderLeft: '2px solid var(--border)', paddingLeft: '8px' }}>
                "{activeSelected.sourceTurn}"
              </div>
            )}

            <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {activeSelected.explanation || 'Analyzed via multi-agent reasoning supervisor.'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: 'auto' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Running Risk</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: (activeSelected.runningRisk ?? 0) > 50 ? 'var(--danger)' : 'var(--primary)' }}>
                {activeSelected.runningRisk ?? 0} / 100
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
