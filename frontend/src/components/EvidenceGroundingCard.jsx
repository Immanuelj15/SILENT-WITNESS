import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, FileSearch, HelpCircle } from 'lucide-react';

export default function EvidenceGroundingCard({ evidence = [], category = '', aiExplanation = '', easyMode = false }) {
  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileSearch size={18} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Explainable Evidence Grounding
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
          Category: {category || 'General Conversation'}
        </span>
      </div>

      {/* Primary AI Rationale */}
      {aiExplanation && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(99, 102, 241, 0.1)',
          borderLeft: '4px solid #6366f1',
          borderRadius: '8px',
          fontSize: easyMode ? '1.05rem' : '0.88rem',
          color: '#e0e7ff',
          marginBottom: '16px'
        }}>
          <strong>AI Analysis:</strong> {aiExplanation}
        </div>
      )}

      {/* Why This Warning Section */}
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
        Why This Safety Rating? Verified Grounded Quotes:
      </div>

      {evidence && evidence.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {evidence.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                background: 'rgba(10, 16, 30, 0.8)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="badge badge-warn" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                  {item.detected_tag}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#34d399' }}>
                  <CheckCircle2 size={13} /> Grounded in Transcript
                </span>
              </div>
              <div style={{ fontStyle: 'italic', color: '#f8fafc', fontSize: easyMode ? '1.05rem' : '0.9rem', marginBottom: '4px' }}>
                "{item.exact_phrase}"
              </div>
              {item.context_note && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {item.context_note}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <ShieldCheck size={28} color="#34d399" style={{ margin: '0 auto 8px', display: 'block' }} />
          No suspicious coercive or credential harvesting phrases verified in the conversation so far.
        </div>
      )}
    </div>
  );
}
