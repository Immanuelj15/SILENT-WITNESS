import React from 'react';
import { Fingerprint, CheckCircle2, AlertOctagon, ArrowRight } from 'lucide-react';

export default function ScriptFingerprintBadge({ scriptFingerprint }) {
  if (!scriptFingerprint || !scriptFingerprint.matched) return null;

  const similarity = Math.round((scriptFingerprint.similarity_score || 0) * 100);

  return (
    <div className="bg-gradient-to-r from-red-950/40 to-slate-900/90 border border-red-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <Fingerprint className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                Known Scam Script Fingerprint
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                {similarity}% Similarity
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white mt-0.5">
              {scriptFingerprint.name}
            </h4>
          </div>
        </div>
      </div>

      {/* Detected Milestones */}
      {scriptFingerprint.detected_milestones && scriptFingerprint.detected_milestones.length > 0 && (
        <div className="mb-3 space-y-1.5 bg-slate-950/40 rounded-xl p-3 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Canonical Attack Milestones Observed:
          </span>
          {scriptFingerprint.detected_milestones.map((milestone, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-red-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
              <span>{milestone}</span>
            </div>
          ))}
        </div>
      )}

      {/* Safe exit advice */}
      {scriptFingerprint.safe_exit_advice && (
        <div className="flex items-start gap-2 text-xs bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-amber-200">
          <AlertOctagon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <span>
            <strong>Safe Action:</strong> {scriptFingerprint.safe_exit_advice}
          </span>
        </div>
      )}
    </div>
  );
}
