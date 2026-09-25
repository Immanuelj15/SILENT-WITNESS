import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, ShieldCheck, Clock, Activity, AlertCircle, RefreshCw } from 'lucide-react';

export default function EvaluationDashboard({ isOpen, onClose }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchMetrics();
    }
  }, [isOpen]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/api/evaluation/metrics');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (e) {
      console.error('Error fetching evaluation metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">AI Evaluation & Benchmark Dashboard</h3>
              <p className="text-xs text-slate-400">
                Rigorous empirical performance metrics measured across standardized scam dialogue suites (Sections 36–40).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMetrics}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-evaluate
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-lg px-2.5 py-1 rounded-lg hover:bg-slate-800 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 italic">
            Running empirical benchmark evaluation over multi-turn dialogues...
          </div>
        ) : !metrics ? (
          <div className="p-8 text-center text-xs text-red-400">Failed to load evaluation metrics.</div>
        ) : (
          <div className="space-y-6">
            {/* Primary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Accuracy</span>
                <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                  {(metrics.accuracy * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] text-slate-500">Overall Ground Truth Match</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Precision</span>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {(metrics.precision * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] text-slate-500">True Scam Predictions</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Recall</span>
                <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                  {(metrics.recall * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] text-slate-500">Scams Successfully Caught</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">F1 Score</span>
                <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
                  {(metrics.f1_score * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] text-slate-500">Harmonic Balance</span>
              </div>
            </div>

            {/* Confusion Matrix & Latencies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Confusion Matrix */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" /> Confusion Matrix (Benchmark Test Set)
                </h4>

                <div className="grid grid-cols-2 gap-3 text-center text-xs">
                  <div className="bg-emerald-950/20 border border-emerald-800/40 p-3 rounded-lg">
                    <span className="text-[11px] text-slate-400 block">True Positives (TP)</span>
                    <span className="text-lg font-mono font-bold text-emerald-400">
                      {metrics.confusion_matrix.true_positives}
                    </span>
                  </div>
                  <div className="bg-red-950/20 border border-red-800/40 p-3 rounded-lg">
                    <span className="text-[11px] text-slate-400 block">False Positives (FP)</span>
                    <span className="text-lg font-mono font-bold text-red-400">
                      {metrics.confusion_matrix.false_positives}
                    </span>
                  </div>
                  <div className="bg-blue-950/20 border border-blue-800/40 p-3 rounded-lg">
                    <span className="text-[11px] text-slate-400 block">True Negatives (TN)</span>
                    <span className="text-lg font-mono font-bold text-blue-400">
                      {metrics.confusion_matrix.true_negatives}
                    </span>
                  </div>
                  <div className="bg-amber-950/20 border border-amber-800/40 p-3 rounded-lg">
                    <span className="text-[11px] text-slate-400 block">False Negatives (FN)</span>
                    <span className="text-lg font-mono font-bold text-amber-400">
                      {metrics.confusion_matrix.false_negatives}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>False Positive Rate: <strong>{(metrics.false_positive_rate * 100).toFixed(1)}%</strong></span>
                  <span>False Negative Rate: <strong>{(metrics.false_negative_rate * 100).toFixed(1)}%</strong></span>
                </div>
              </div>

              {/* Latency Metrics */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" /> Operational Latency Profiles (ms / sec)
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Time-to-First-Warning (TTFW):</span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {metrics.latency_metrics.avg_time_to_first_warning_sec}s
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Multi-Agent E2E Latency:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {metrics.latency_metrics.avg_processing_latency_ms} ms
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Rolling Transcript Window Latency:</span>
                    <span className="font-mono text-slate-300 font-bold">
                      {metrics.latency_metrics.avg_transcript_latency_ms} ms
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Deterministic Risk Update Latency:</span>
                    <span className="font-mono text-indigo-400 font-bold">
                      {metrics.latency_metrics.avg_risk_update_latency_ms} ms
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Performance Breakdown */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                Performance by Scam Category (Section 38)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Category</th>
                      <th className="p-2 text-center">Precision</th>
                      <th className="p-2 text-center">Recall</th>
                      <th className="p-2 text-center">F1 Score</th>
                      <th className="p-2 text-center">Samples</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {Object.entries(metrics.category_performance || {}).map(([cat, stats]) => (
                      <tr key={cat} className="hover:bg-slate-900/40">
                        <td className="p-2 font-sans font-medium text-slate-200">{cat}</td>
                        <td className="p-2 text-center text-emerald-400 font-bold">
                          {(stats.precision * 100).toFixed(0)}%
                        </td>
                        <td className="p-2 text-center text-cyan-400 font-bold">
                          {(stats.recall * 100).toFixed(0)}%
                        </td>
                        <td className="p-2 text-center text-indigo-400 font-bold">
                          {(stats.f1 * 100).toFixed(0)}%
                        </td>
                        <td className="p-2 text-center text-slate-400">{stats.samples}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Language Performance Breakdown */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                Multilingual & Code-Switching Performance (Section 39)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(metrics.language_performance || {}).map(([lang, stats]) => (
                  <div key={lang} className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg text-xs">
                    <span className="font-semibold text-slate-200 block mb-1">{lang}</span>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Precision: <strong className="text-emerald-400 font-mono">{(stats.precision * 100).toFixed(0)}%</strong></span>
                      <span>Recall: <strong className="text-cyan-400 font-mono">{(stats.recall * 100).toFixed(0)}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic text-center">
              Section 101 Notice: Metrics are dynamically computed against active validation dialogue sets. No fabricated statistics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
