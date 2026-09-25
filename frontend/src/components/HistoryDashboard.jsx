import React, { useEffect, useState } from 'react';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  PhoneCall,
  Clock,
  Download,
  X,
  FileText,
  ExternalLink
} from 'lucide-react';
import apiClient from '../utils/apiClient';

export default function HistoryDashboard({ onSelectSession = null }) {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, SAFE, GUARDED, HIGH_RISK, CRITICAL
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCall, setSelectedCall] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get('/api/history');
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch {
      // Fallback sample records if DB is clean
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Standard fallback demo history if fresh installation
  const defaultHistory = [
    {
      id: "call-901",
      caller: "Unknown Inbound Contact",
      phone_number: "+91 98765 43210",
      channel: "WhatsApp",
      date: "Today, 10:42 AM",
      duration: "02m 14s",
      trustScore: 27,
      riskScore: 73,
      status: "High Risk",
      category: "Banking Impersonation",
      summary: "Caller claimed SBI security branch, pressured victim with 30-minute freeze deadline, and asked for SMS OTP.",
      evidence: [
        { phrase: "SBI security branch", tag: "Identity Claim" },
        { phrase: "blocked within 30 minutes", tag: "Urgency Pressure" },
        { phrase: "tell me the OTP immediately", tag: "Credential Demand" }
      ],
      signals: {
        voice: "Natural Human (14% risk)",
        identity: "Unverified Inbound",
        intent: "Credential Harvesting (High)",
        screenShare: "Not Requested"
      }
    },
    {
      id: "call-902",
      caller: "Dr. Ramesh (Family)",
      phone_number: "+44 7911 123456",
      channel: "WhatsApp Video",
      date: "Today, 09:15 AM",
      duration: "08m 42s",
      trustScore: 92,
      riskScore: 8,
      status: "Safe",
      category: "Legitimate Conversation",
      summary: "International family check-in call. Normal conversation about travel schedule.",
      evidence: [],
      signals: {
        voice: "Natural Voice (6% risk)",
        identity: "Saved Contact (Mom/Brother)",
        intent: "Personal Chat (None)",
        screenShare: "Not Requested"
      }
    },
    {
      id: "call-903",
      caller: "Courier Delivery Logistics",
      phone_number: "+91 80123 45678",
      channel: "SIM Cellular",
      date: "Yesterday, 04:30 PM",
      duration: "01m 05s",
      trustScore: 68,
      riskScore: 32,
      status: "Guarded",
      category: "Unverified Business",
      summary: "Delivery driver confirming address. No credential solicitations detected.",
      evidence: [],
      signals: {
        voice: "Human Voice (10% risk)",
        identity: "Unsaved Commercial Number",
        intent: "Standard Delivery (Low)",
        screenShare: "Not Supported"
      }
    },
    {
      id: "call-904",
      caller: "Fake Tech Support",
      phone_number: "+1 800 555 0199",
      channel: "WhatsApp Video",
      date: "24 Sep 2026",
      duration: "04m 12s",
      trustScore: 8,
      riskScore: 92,
      status: "Critical",
      category: "Screen-Sharing Fraud",
      summary: "Caller posed as Microsoft Tech Support and demanded screen sharing to steal banking credentials.",
      evidence: [
        { phrase: "tap share screen now", tag: "Screen Share Demand" },
        { phrase: "open your banking app", tag: "Financial Coercion" }
      ],
      signals: {
        voice: "Telephony VoIP (25% risk)",
        identity: "International Virtual VoIP",
        intent: "Remote Coercion (Critical)",
        screenShare: "Active Coercion Detected"
      }
    }
  ];

  const records = history.length > 0 ? history : defaultHistory;

  const filteredRecords = records.filter((r) => {
    // Category / status filter
    if (filter === 'SAFE' && (r.trustScore < 80)) return false;
    if (filter === 'GUARDED' && (r.trustScore < 50 || r.trustScore >= 80)) return false;
    if (filter === 'HIGH_RISK' && (r.trustScore >= 50 || r.trustScore < 20)) return false;
    if (filter === 'CRITICAL' && (r.trustScore >= 20)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCaller = (r.caller || '').toLowerCase().includes(q);
      const matchNum = (r.phone_number || '').toLowerCase().includes(q);
      const matchCat = (r.category || '').toLowerCase().includes(q);
      return matchCaller || matchNum || matchCat;
    }
    return true;
  });

  const getStatusBadge = (score) => {
    if (score >= 80) return <span className="badge badge-success">Safe</span>;
    if (score >= 50) return <span className="badge badge-warning">Guarded</span>;
    if (score >= 20) return <span className="badge badge-danger">High Risk</span>;
    return <span className="badge badge-danger" style={{ backgroundColor: 'var(--critical-bg)', color: 'var(--critical)' }}>Critical</span>;
  };

  const handleExportCall = (call) => {
    const blob = new Blob([JSON.stringify(call, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SilentWitness_CallReport_${call.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <History size={18} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Call Protection History
            </h2>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Review past screened conversations, forensic threat attributions, and trust score timelines.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="sw-card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by caller, number, threat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sw-input"
            style={{ paddingLeft: '32px', height: '34px', fontSize: '13px' }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'SAFE', 'GUARDED', 'HIGH_RISK', 'CRITICAL'].map((f) => {
            const isSel = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: isSel ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: isSel ? 'var(--primary-light)' : 'var(--surface)',
                  color: isSel ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* History Data Table (Section 27) */}
      <div className="sw-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 20px' }}>Caller</th>
                <th style={{ padding: '12px 20px' }}>Channel</th>
                <th style={{ padding: '12px 20px' }}>Date & Duration</th>
                <th style={{ padding: '12px 20px' }}>Trust Score</th>
                <th style={{ padding: '12px 20px' }}>Status</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No call records matching your current filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((c, idx) => (
                  <tr
                    key={c.id || idx}
                    onClick={() => setSelectedCall(c)}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'background-color 0.12s ease',
                      backgroundColor: idx % 2 === 0 ? 'var(--surface)' : 'var(--bg-main)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-light)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'var(--surface)' : 'var(--bg-main)'; }}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.caller}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.phone_number}</div>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                      {c.channel || 'SIM Cellular'}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      <div>{c.date || 'Today'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.duration || '01m 30s'}</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: c.trustScore < 50 ? 'var(--danger)' : c.trustScore < 80 ? 'var(--warning)' : 'var(--success)' }}>
                        {c.trustScore}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}> / 100</span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {getStatusBadge(c.trustScore)}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedCall(c); }}
                        className="btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        <span>Details</span>
                        <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Call Details Drawer/Modal (Section 28) */}
      {selectedCall && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            padding: '20px',
          }}
        >
          <div
            className="sw-card"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'relative',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em' }}>
                  CALL FORENSIC REPORT
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedCall.caller}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {selectedCall.phone_number} • {selectedCall.channel} • {selectedCall.date}
                </div>
              </div>

              <button onClick={() => setSelectedCall(null)} className="btn-ghost" style={{ padding: '6px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Score & Category */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>CLASSIFICATION</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedCall.category || 'General Conversation'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>FINAL TRUST SCORE</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: selectedCall.trustScore < 50 ? 'var(--danger)' : 'var(--success)' }}>
                  {selectedCall.trustScore} / 100
                </div>
              </div>
            </div>

            {/* Risk Summary Grid */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Signal Breakdown
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div style={{ padding: '10px 12px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Voice Authenticity</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedCall.signals?.voice || 'Natural human'}</div>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Caller Identity</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedCall.signals?.identity || 'Unverified'}</div>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fraud Intent Engine</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedCall.signals?.intent || 'Low'}</div>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Screen-Share Status</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedCall.signals?.screenShare || 'Not Active'}</div>
                </div>
              </div>
            </div>

            {/* Summary Narrative */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Forensic Conversation Summary
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {selectedCall.summary}
              </p>
            </div>

            {/* Evidence Tags */}
            {selectedCall.evidence && selectedCall.evidence.length > 0 && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Evidence Grounding
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedCall.evidence.map((ev, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--danger-bg)',
                        border: '1px solid var(--danger-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ fontStyle: 'italic', color: 'var(--danger-text)', fontWeight: 500 }}>"{ev.phrase}"</span>
                      <span className="badge badge-danger" style={{ fontSize: '10px' }}>{ev.tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button onClick={() => handleExportCall(selectedCall)} className="btn-secondary">
                <Download size={14} />
                <span>Export Report (JSON)</span>
              </button>
              <button onClick={() => setSelectedCall(null)} className="btn-primary">
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
