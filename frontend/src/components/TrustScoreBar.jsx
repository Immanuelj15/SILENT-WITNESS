import React from 'react';
import { Shield, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';

export default function TrustScoreBar({
  trustScore = 100,
  riskScore = 0,
  classification = 'SAFE',
  category = 'Legitimate Interaction',
  voiceAnalysis,
  callerReputation,
  evidence = [],
  sensitiveRequest = null,
}) {
  const score = Math.max(0, Math.min(100, Math.round(trustScore)));

  // Severity color calculation
  const getTheme = () => {
    if (score >= 80) {
      return {
        label: 'Safe',
        color: 'var(--success)',
        bg: 'var(--success-bg)',
        border: 'var(--success-border)',
        badgeClass: 'badge-success',
      };
    }
    if (score >= 50) {
      return {
        label: 'Guarded',
        color: 'var(--warning)',
        bg: 'var(--warning-bg)',
        border: 'var(--warning-border)',
        badgeClass: 'badge-warning',
      };
    }
    return {
      label: 'High Risk',
      color: 'var(--danger)',
      bg: 'var(--danger-bg)',
      border: 'var(--danger-border)',
      badgeClass: 'badge-danger',
    };
  };

  const theme = getTheme();

  // Metrics breakdown calculation
  const voiceRisk = voiceAnalysis?.voiceRisk ?? 12;
  const isSynthetic = voiceAnalysis?.is_synthetic_suspected ?? false;
  const voiceStatus = isSynthetic ? 'Deepfake Suspected' : voiceRisk > 50 ? 'Moderate Anomaly' : 'Low Risk';
  const voiceProgress = Math.min(100, Math.max(5, 100 - voiceRisk));

  const isVerifiedIdentity = callerReputation?.is_in_contacts || callerReputation?.is_verified_org;
  const identityStatus = isVerifiedIdentity ? 'Verified Contact' : 'Unverified Inbound';
  const identityProgress = isVerifiedIdentity ? 95 : 45;

  const hasUrgency = evidence?.some((e) => (typeof e === 'string' ? e : e?.category || '').toLowerCase().includes('urgency'));
  const hasImpersonation = evidence?.some((e) => (typeof e === 'string' ? e : e?.category || '').toLowerCase().includes('impersonation'));
  const socialEngStatus = hasUrgency || hasImpersonation ? 'Detected' : 'Low';
  const socialEngProgress = hasUrgency || hasImpersonation ? 30 : 90;

  const fraudIntentProgress = Math.max(10, 100 - riskScore);
  const fraudIntentStatus = riskScore > 60 ? 'Critical' : riskScore > 30 ? 'Moderate' : 'Low';

  const hasSensitiveReq = sensitiveRequest || evidence?.some((e) => (typeof e === 'string' ? e : e?.category || '').toLowerCase().includes('credential') || (typeof e === 'string' ? e : e?.category || '').toLowerCase().includes('otp'));
  const sensitiveStatus = hasSensitiveReq ? 'OTP / Credentials Demanded' : 'None Detected';
  const sensitiveProgress = hasSensitiveReq ? 20 : 100;

  const breakdownItems = [
    { label: 'Voice Authenticity', status: voiceStatus, value: voiceProgress, isAlert: isSynthetic },
    { label: 'Identity Verification', status: identityStatus, value: identityProgress, isAlert: !isVerifiedIdentity },
    { label: 'Social Engineering', status: socialEngStatus, value: socialEngProgress, isAlert: socialEngStatus === 'Detected' },
    { label: 'Fraud Intent', status: fraudIntentStatus, value: fraudIntentProgress, isAlert: fraudIntentStatus !== 'Low' },
    { label: 'Sensitive Request', status: sensitiveStatus, value: sensitiveProgress, isAlert: hasSensitiveReq },
  ];

  return (
    <div className="sw-card" style={{ padding: '20px 24px' }}>
      {/* Header Row: Score + Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Trust Score
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: theme.color, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {score}
            </span>
            <span style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500 }}>/ 100</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span className={`badge ${theme.badgeClass}`} style={{ fontSize: '13px', padding: '5px 12px' }}>
            {theme.label}
          </span>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {category}
          </div>
        </div>
      </div>

      {/* Main Horizontal Progress Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div className="progress-bar-bg" style={{ height: '10px' }}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${score}%`,
              backgroundColor: theme.color,
            }}
          />
        </div>
      </div>

      {/* Sub-Signals Breakdown with Horizontal Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        {breakdownItems.map((item, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 140px', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              {item.label}
            </span>

            <div className="progress-bar-bg" style={{ height: '6px' }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${item.value}%`,
                  backgroundColor: item.isAlert ? 'var(--danger)' : 'var(--primary)',
                }}
              />
            </div>

            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                textAlign: 'right',
                color: item.isAlert ? 'var(--danger)' : 'var(--text-primary)',
              }}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
