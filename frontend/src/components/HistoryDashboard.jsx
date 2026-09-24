import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, ShieldX, Clock, Database, RefreshCw } from 'lucide-react';

export default function HistoryDashboard({ onSelectSession = null }) {
  const [stats, setStats] = useState({
    total_calls: 0,
    safe_calls: 0,
    suspicious_calls: 0,
    high_risk_calls: 0,
    average_trust_score: 100
  });
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatsAndHistory = async () => {
    setIsLoading(true);
    try {
      const [resStats, resHist] = await Promise.all([
        fetch('http://localhost:8000/api/stats').then(r => r.json()).catch(() => null),
        fetch('http://localhost:8000/api/history').then(r => r.json()).catch(() => [])
      ]);

      if (resStats) setStats(resStats);
      if (resHist) setHistory(resHist);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndHistory();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Calls Monitored
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
            {stats.total_calls}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 600 }}>
            Verified Safe Calls
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            {stats.safe_calls}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 600 }}>
            Suspicious Calls
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
            {stats.suspicious_calls}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 600 }}>
            High-Risk Scam Intercepts
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f87171', marginTop: '4px' }}>
            {stats.high_risk_calls}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 600 }}>
            Average Trust Score
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
            {stats.average_trust_score}/100
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Historical Call Session Log
            </span>
          </div>
          <button onClick={fetchStatsAndHistory} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No call records stored yet. Run a live call monitor or audio file analysis to populate records.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Date / Time</th>
                  <th style={{ padding: '10px' }}>Classification</th>
                  <th style={{ padding: '10px' }}>Trust Score</th>
                  <th style={{ padding: '10px' }}>Category</th>
                  <th style={{ padding: '10px' }}>Transcript Preview</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const isScam = item.riskScore > 60;
                  const isWarn = item.riskScore > 30 && item.riskScore <= 60;
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      className="glass-card-interactive"
                      onClick={() => onSelectSession && onSelectSession(item.id)}
                    >
                      <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                        {item.created_at ? new Date(item.created_at).toLocaleTimeString() : 'Recent'}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span className={`badge ${isScam ? 'badge-danger' : isWarn ? 'badge-warn' : 'badge-safe'}`}>
                          {item.classification}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: isScam ? '#ef4444' : isWarn ? '#f59e0b' : '#10b981' }}>
                        {item.trustScore}/100
                      </td>
                      <td style={{ padding: '12px 10px', color: '#38bdf8' }}>
                        {item.category}
                      </td>
                      <td style={{ padding: '12px 10px', color: '#cbd5e1', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.snippet}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
