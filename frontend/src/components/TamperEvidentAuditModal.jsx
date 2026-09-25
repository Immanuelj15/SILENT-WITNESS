import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Link2, Download, CheckCircle, AlertTriangle, Hash } from 'lucide-react';

export default function TamperEvidentAuditModal({ isOpen, onClose, sessionId }) {
  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState(null);
  const [integrity, setIntegrity] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchAuditChain = async () => {
      setLoading(true);
      setError(null);
      try {
        const sid = sessionId || 'default-session';
        const [chainRes, integrityRes] = await Promise.all([
          fetch(`/api/audit-log/${sid}`),
          fetch(`/api/audit-log/${sid}/verify`)
        ]);

        if (!chainRes.ok || !integrityRes.ok) {
          throw new Error('Failed to fetch cryptographic audit ledger');
        }

        const chainJson = await chainRes.json();
        const integrityJson = await integrityRes.json();

        setAuditData(chainJson);
        setIntegrity(integrityJson);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditChain();
  }, [isOpen, sessionId]);

  const handleDownload = () => {
    if (!auditData) return;
    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SilentWitness_Evidence_Ledger_${sessionId || 'session'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Tamper-Evident Cryptographic Audit Ledger
              </h3>
              <p className="text-xs text-slate-400">
                SHA-256 hash-chained session blocks for court & cybercrime (1930) evidentiary proof
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Verifying cryptographic hash chain integrity...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          ) : (
            <>
              {/* Integrity status card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl border ${integrity?.valid ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-red-950/20 border-red-500/30'}`}>
                  <div className="flex items-center gap-2 text-xs font-semibold mb-1">
                    {integrity?.valid ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                    <span className={integrity?.valid ? 'text-emerald-300' : 'text-red-300'}>
                      Chain Integrity
                    </span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {integrity?.valid ? '100% UNTAMPERED' : 'CORRUPTED'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <span className="text-xs text-slate-400 font-semibold">Total Blocks Chained</span>
                  <p className="text-lg font-bold text-white font-mono mt-1">
                    {auditData?.ledger_blocks?.length || 0} Blocks
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <span className="text-xs text-slate-400 font-semibold">Latest Block Hash</span>
                  <p className="text-xs font-mono text-cyan-300 truncate mt-1">
                    {integrity?.latest_hash || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Block Timeline / Chain list */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-cyan-400" /> Cryptographic Block Sequence
                </h4>

                {auditData?.ledger_blocks?.map((block, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/70 hover:border-cyan-500/40 transition font-mono text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="font-bold text-cyan-400">
                        Block #{block.index}: {block.event_type}
                      </span>
                      <span className="text-slate-500">
                        {new Date(block.timestamp * 1000).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500">Previous Hash:</span>
                        <p className="text-slate-400 truncate">{block.previous_hash}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Block SHA-256:</span>
                        <p className="text-cyan-300 truncate font-semibold">{block.hash}</p>
                      </div>
                    </div>

                    <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 overflow-x-auto">
                      {JSON.stringify(block.data)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <p className="text-xs text-slate-400">
            Adheres to Indian Evidence Act & Section 65B Electronic Record certification standards.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={!auditData}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition"
            >
              <Download className="w-4 h-4" /> Download Evidence Package (.json)
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
