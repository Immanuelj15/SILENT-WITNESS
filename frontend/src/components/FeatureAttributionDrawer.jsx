import React from 'react';
import { Layers, TrendingDown, ShieldCheck, AlertCircle, Info } from 'lucide-react';

export default function FeatureAttributionDrawer({ attributions = [], severityTier = {}, easyMode = false }) {
  const tierColor = severityTier?.color || '#10b981';
  const tierLabel = severityTier?.label || '80–100 (Monitor)';
  const tierAction = severityTier?.action || 'No action needed, continue normal monitoring';

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Feature Attribution & Severity Tier
          </span>
        </div>
        <span style={{
          fontSize: '0.78rem',
          fontWeight: 700,
          color: tierColor,
          padding: '3px 10px',
          borderRadius: '9999px',
          background: `${tierColor}1a`,
          border: `1px solid ${tierColor}55`
        }}>
          {tierLabel}
        </span>
      </div>

      {/* Severity tier action banner */}
      <div style={{
        padding: '10px 14px',
        borderRadius: '8px',
        background: 'rgba(15, 23, 42, 0.6)',
        borderLeft: `4px solid ${tierColor}`,
        fontSize: easyMode ? '1.05rem' : '0.84rem',
        color: '#e2e8f0',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Info size={16} color={tierColor} style={{ flexShrink: 0 }} />
        <span><strong>Tier Action:</strong> {tierAction}</span>
      </div>

      {/* Attributions breakdown */}
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
        Active Signal Point Deductions:
      </div>

      {attributions && attributions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {attributions.map((attr, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(9, 14, 26, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <div>
                <div style={{ fontSize: easyMode ? '1rem' : '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
                  {attr.feature_name}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {attr.description}
                </div>
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: '#ef4444',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <TrendingDown size={14} />
                {attr.deduction_points}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          No risk deductions active. Score at baseline.
        </div>
      )}
    </div>
  );
}
