import React, { useState } from 'react';
import { UserCheck, ShieldAlert, CheckCircle2, AlertTriangle, PhoneCall, ExternalLink, X } from 'lucide-react';

export default function IdentityVerificationPanel({ identityAudit, callerReputation }) {
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const callerName = callerReputation?.contact_name || 'Unknown Caller';
  const phoneNumber = callerReputation?.phone_number || '+91 98765 43210';
  const claimedRole = identityAudit?.claimedRole || identityAudit?.claimedOrganization || 'Claimed Bank / Official Representative';
  const isVerified = identityAudit?.verificationStatus === 'VERIFIED';
  const statusLabel = isVerified ? 'VERIFIED' : 'UNVERIFIED';

  return (
    <div className="sw-card" style={{ padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <UserCheck size={16} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Caller Identity & Authority Audit
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Verification status against registered public directories
            </div>
          </div>
        </div>

        <span className={`badge ${isVerified ? 'badge-success' : 'badge-warning'}`}>
          {statusLabel}
        </span>
      </div>

      {/* Identity Summary Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          backgroundColor: 'var(--bg-main)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '14px',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>CALLER</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{callerName}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{phoneNumber}</div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>CLAIMED IDENTITY</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{claimedRole}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Claimed during conversation</div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>VERIFICATION EVIDENCE</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: isVerified ? 'var(--success)' : 'var(--warning-text)', marginTop: '2px' }}>
            {isVerified ? 'Official Registry Match' : 'Identity could not be verified'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No reliable cryptographic or telecom confirmation</div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
          Legitimate banking and government officials never demand OTPs or passwords over the phone.
        </p>

        <button onClick={() => setShowVerifyModal(true)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
          <span>Verify Caller</span>
          <ExternalLink size={13} />
        </button>
      </div>

      {/* Verify Caller Modal */}
      {showVerifyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            padding: '16px',
          }}
        >
          <div
            className="sw-card"
            style={{
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} style={{ color: 'var(--warning)' }} />
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Out-of-Band Verification Protocol
                </h3>
              </div>
              <button onClick={() => setShowVerifyModal(false)} className="btn-ghost" style={{ padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
              The caller claims to represent <strong>{claimedRole}</strong>. To prevent impersonation fraud:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>1.</span>
                <span>Do NOT share any account details, OTP, or passwords on this call.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>2.</span>
                <span>Hang up the conversation immediately.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>3.</span>
                <span>Call the organization back directly using the phone number printed on the back of your official debit/credit card or verified official website.</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowVerifyModal(false)} className="btn-primary">
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
