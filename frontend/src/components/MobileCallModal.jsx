import React from 'react';
import { Phone, PhoneOff, Shield, ShieldAlert, AlertTriangle, X, Volume2 } from 'lucide-react';

export default function MobileCallModal({ isOpen = false, onClose = null, analysis = null, onEndCall = null }) {
  if (!isOpen) return null;

  const trustScore = analysis?.trustScore ?? 100;
  const isHighDanger = trustScore < 40;
  const isSuspicious = trustScore >= 40 && trustScore < 70;

  let bannerClass = 'badge-safe';
  let bannerText = '🟢 SAFE CONVERSATION';
  if (isHighDanger) {
    bannerClass = 'badge-danger';
    bannerText = '🔴 HIGH DANGER — LIKELY SCAM';
  } else if (isSuspicious) {
    bannerClass = 'badge-warn';
    bannerText = '🟠 BE CAREFUL — SUSPICIOUS';
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      {/* Mobile Device Frame */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        height: '680px',
        backgroundColor: '#0b1120',
        borderRadius: '40px',
        border: '3px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 35px rgba(6, 182, 212, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Mobile Speaker Notch */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120px',
          height: '24px',
          backgroundColor: '#030712',
          borderRadius: '16px',
          zIndex: 10
        }} />

        {/* Close Modal button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            zIndex: 20
          }}
        >
          <X size={20} />
        </button>

        {/* Mobile Call Content */}
        <div style={{ padding: '48px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Caller Identity */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: isHighDanger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(6, 182, 212, 0.2)',
              border: isHighDanger ? '2px solid #ef4444' : '2px solid #06b6d4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <Phone size={32} color={isHighDanger ? '#ef4444' : '#06b6d4'} />
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              Unknown Caller
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              +91 (Unverified Inbound Voice)
            </div>
          </div>

          {/* Real-time Safety Layer Status */}
          <div style={{ textAlign: 'center', margin: '14px 0' }}>
            <div className={`badge ${bannerClass}`} style={{ fontSize: '0.88rem', padding: '6px 16px', marginBottom: '12px' }}>
              {bannerText}
            </div>

            <div style={{
              fontSize: '3.6rem',
              fontWeight: 800,
              color: isHighDanger ? '#ef4444' : isSuspicious ? '#f59e0b' : '#10b981',
              lineHeight: 1
            }}>
              {trustScore}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em' }}>
              TRUST SCORE
            </div>
          </div>

          {/* Transcript Snippet & Danger Tags */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '14px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            maxHeight: '130px',
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
              Live Transcript
            </div>
            <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#e2e8f0', marginBottom: '8px' }}>
              "{analysis?.transcript?.slice(-120) || 'Listening to caller...'}"
            </div>

            {/* Risk Factors Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {analysis?.riskFactors?.map((rf, i) => (
                <span key={i} style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.25)', color: '#fca5a5', fontWeight: 600 }}>
                  ⚠ {rf}
                </span>
              ))}
            </div>
          </div>

          {/* Large Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={() => {
                if (onEndCall) onEndCall();
                onClose();
              }}
              style={{
                height: '60px',
                borderRadius: '18px',
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)'
              }}
            >
              <PhoneOff size={20} />
              END CALL
            </button>

            <button
              onClick={() => {
                alert("Please call the official phone number printed on the back of your bank debit card or visit the branch directly.");
              }}
              style={{
                height: '60px',
                borderRadius: '18px',
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Shield size={20} />
              VERIFY CALLER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
