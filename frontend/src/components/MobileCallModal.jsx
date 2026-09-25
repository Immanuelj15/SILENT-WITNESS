import React from 'react';
import { PhoneOff, Shield, AlertTriangle, X, CheckCircle2, UserCheck } from 'lucide-react';

export default function MobileCallModal({ isOpen = false, onClose = null, analysis = null, onEndCall = null }) {
  if (!isOpen) return null;

  const trustScore = analysis?.trustScore ?? 42;
  const isHighDanger = trustScore < 50;
  const isSuspicious = trustScore >= 50 && trustScore < 80;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      {/* Modern Android Phone Frame */}
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          height: '720px',
          backgroundColor: '#FFFFFF',
          borderRadius: '44px',
          border: '12px solid #0F172A',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Notch / Punch-hole Camera */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '14px',
            height: '14px',
            backgroundColor: '#0F172A',
            borderRadius: '50%',
            zIndex: 10,
          }}
        />

        {/* Close Modal button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#64748B',
            cursor: 'pointer',
            zIndex: 20,
            padding: '4px',
          }}
        >
          <X size={18} />
        </button>

        {/* Phone Content Area */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#F8FAFC',
            padding: '48px 24px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Top Brand Banner */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#2563EB', fontWeight: 800, fontSize: '12px', letterSpacing: '0.06em' }}>
              <Shield size={14} />
              <span>SILENT WITNESS</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              AI Real-Time Call Protection
            </div>
          </div>

          {/* Caller Identity Section */}
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#EFF6FF',
                border: '2px solid #BFDBFE',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '22px',
                fontWeight: 700,
              }}
            >
              ?
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
              Unknown Caller
            </h3>
            <div style={{ fontSize: '13px', color: '#64748B', fontFamily: 'monospace' }}>
              +91 98765 43210
            </div>
            <div style={{ fontSize: '11px', color: '#B45309', fontWeight: 600, marginTop: '4px' }}>
              Unverified Inbound Contact
            </div>
          </div>

          {/* Safety Status Card (Section 26) */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: `1.5px solid ${isHighDanger ? '#FECACA' : '#FDE68A'}`,
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
              CURRENT TRUST SCORE
            </div>

            <div style={{ fontSize: '32px', fontWeight: 900, color: isHighDanger ? '#DC2626' : '#F59E0B', margin: '4px 0' }}>
              {trustScore} <span style={{ fontSize: '14px', color: '#94A3B8' }}>/ 100</span>
            </div>

            <div
              style={{
                display: 'inline-block',
                padding: '3px 12px',
                borderRadius: '999px',
                backgroundColor: isHighDanger ? '#FEF2F2' : '#FFFBEB',
                color: isHighDanger ? '#DC2626' : '#B45309',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                marginBottom: '10px',
              }}
            >
              {isHighDanger ? 'HIGH RISK' : 'GUARDED'}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#DC2626',
                marginBottom: '6px',
              }}
            >
              <AlertTriangle size={14} />
              <span>⚠ OTP request detected</span>
            </div>

            <div style={{ fontSize: '12px', color: '#0F172A', fontWeight: 500 }}>
              Recommended: <strong>Do not share OTP.</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => {
                if (onEndCall) onEndCall();
                if (onClose) onClose();
              }}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <PhoneOff size={16} />
              <span>END CALL</span>
            </button>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '11px',
                backgroundColor: '#FFFFFF',
                color: '#2563EB',
                border: '1.5px solid #BFDBFE',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <UserCheck size={16} />
              <span>VERIFY CALLER</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
