import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, AlertTriangle, XCircle, Info, Shield, Smartphone, Globe, Radio } from 'lucide-react';
import apiClient from '../utils/apiClient';

export default function CapabilitiesPage() {
  const [capabilities, setCapabilities] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/platforms/capabilities')
      .then((data) => {
        if (data && typeof data === 'object') {
          setCapabilities(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const renderBadge = (type) => {
    switch (type) {
      case 'ACTIVE':
        return (
          <span className="badge badge-success" style={{ fontSize: '11px' }}>
            ✓ Active
          </span>
        );
      case 'CONDITIONAL':
      case 'LIMITED':
        return (
          <span className="badge badge-warning" style={{ fontSize: '11px' }}>
            △ Conditional
          </span>
        );
      case 'PLATFORM_RESTRICTED':
      case 'UNAVAILABLE':
      default:
        return (
          <span className="badge badge-neutral" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            — Unavailable
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Cpu size={18} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Protection Capabilities
          </h2>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          What Silent Witness can currently analyze across communication channels and operating systems.
        </p>
      </div>

      {/* Platform Honesty Banner */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '8px',
          backgroundColor: 'var(--primary-light)',
          border: '1px solid #BFDBFE',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <Info size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          <strong>Platform Architecture Disclosure:</strong> Telephony security capabilities depend strictly on operating system sandboxing. Silent Witness never claims impossible direct audio taps into closed OTT applications without standard accessibility or companion OS permissions.
        </div>
      </div>

      {/* 3 Main Channel Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Card 1: SIM Cellular */}
        <div className="sw-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)' }}>
              <Radio size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                SIM Cellular
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Carrier telecommunications & standard cellular calls
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Caller Screening</span>
              {renderBadge('ACTIVE')}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Audio Analysis</span>
              {renderBadge('CONDITIONAL')}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>SMS Phishing Prior</span>
              {renderBadge('ACTIVE')}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Carrier Identity Plausibility</span>
              {renderBadge('ACTIVE')}
            </div>
          </div>
        </div>

        {/* Card 2: WhatsApp / Online */}
        <div className="sw-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
              <Smartphone size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                WhatsApp / Online
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                VoIP internet messaging apps & video meetings
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Caller Identity Signals</span>
              {renderBadge('CONDITIONAL')}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Live Audio Stream Capture</span>
              {renderBadge('PLATFORM_RESTRICTED')}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Screen-Share Detection</span>
              {renderBadge('CONDITIONAL')}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Chat Link & APK Scanner</span>
              {renderBadge('ACTIVE')}
            </div>
          </div>
        </div>

        {/* Card 3: Secure WebRTC */}
        <div className="sw-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Globe size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Secure WebRTC
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Enterprise SDK integrated native call connections
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Real-Time Audio Analysis</span>
              {renderBadge('ACTIVE')}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Video & Visual Integrity</span>
              {renderBadge('ACTIVE')}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Full AI Multi-Agent Reasoning</span>
              {renderBadge('ACTIVE')}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Screen Sharing Defense</span>
              {renderBadge('ACTIVE')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
