import React from 'react';
import { Video, ShieldAlert, CheckCircle2, AlertTriangle, Eye, ShieldCheck, CameraOff } from 'lucide-react';

export default function VideoAnalysisVisualizer({ videoResult }) {
  if (!videoResult) return null;

  const visualRisk = videoResult.visual_risk || videoResult.visualRisk || 0;
  const isExtortion = videoResult.is_extortion || videoResult.is_extortion_detected || false;
  const signals = videoResult.signals || [];

  return (
    <div className={`rounded-2xl p-5 border shadow-xl backdrop-blur-md transition-all ${
      isExtortion
        ? 'bg-red-950/40 border-red-500/60 shadow-red-950/50'
        : visualRisk > 40
        ? 'bg-slate-900/90 border-amber-500/40'
        : 'bg-slate-900/90 border-slate-800'
    }`}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${
            isExtortion
              ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
              : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
          }`}>
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Video Call & Visual Deepfake Shield
            </h4>
            <p className="text-[11px] text-slate-400">
              Temporal face consistency, lip-sync mismatch & extortion lure recognition
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className={`text-xl font-bold font-mono ${
            visualRisk >= 60 ? 'text-red-400' : visualRisk >= 30 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {visualRisk}%
          </span>
          <span className="text-[10px] text-slate-500 block uppercase font-mono">Visual Risk</span>
        </div>
      </div>

      {/* Extortion Warning Banner */}
      {isExtortion && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-3.5 mb-4 text-xs text-red-200">
          <div className="flex items-center gap-2 font-bold text-sm text-red-100 mb-1">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            CRITICAL: Video Extortion & Blackmail Lure Pattern Detected
          </div>
          <p className="leading-relaxed">
            The caller is attempting to record your camera or use blackmail threats. <strong>DO NOT PAY.</strong> Cover your camera or disconnect immediately.
          </p>
        </div>
      )}

      {/* Visual Signals List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-cyan-400" /> Lip-Sync Match
          </span>
          {signals.includes("lip_sync_inconsistency") ? (
            <span className="text-red-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Mismatch
            </span>
          ) : (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Natural
            </span>
          )}
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-purple-400" /> Face Temporal Mesh
          </span>
          {signals.includes("face_temporal_anomaly") ? (
            <span className="text-red-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Artifacts
            </span>
          ) : (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Consistent
            </span>
          )}
        </div>
      </div>

      {/* Recommended protocol */}
      <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
        <span>Zero-Storage Policy: Video frames never saved to disk.</span>
        {isExtortion && (
          <span className="text-red-300 font-bold flex items-center gap-1">
            <CameraOff className="w-3.5 h-3.5" /> Disconnect Recommended
          </span>
        )}
      </div>
    </div>
  );
}
