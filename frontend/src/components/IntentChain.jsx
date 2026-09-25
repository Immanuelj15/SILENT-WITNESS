import React, { useState } from 'react';
import { GitCommit, ShieldAlert, CheckCircle, ChevronRight, AlertCircle, Info } from 'lucide-react';

export default function IntentChain({ intentChain }) {
  const [selectedStage, setSelectedStage] = useState(null);

  if (!intentChain || !intentChain.stages || intentChain.stages.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-3">
          <GitCommit className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-slate-200">Scam Intent Chain (Attack Progression)</h3>
        </div>
        <p className="text-sm text-slate-400 italic">
          Monitoring dialogue progression... Multi-stage scam attack vectors will link here.
        </p>
      </div>
    );
  }

  const { stages, progressionState, isFullAttackChain } = intentChain;
  const activeStage = selectedStage || stages[stages.length - 1];

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <GitCommit className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-slate-200">Scam Intent Chain (Attack Progression)</h3>
        </div>
        <div className="flex items-center gap-2">
          {isFullAttackChain && (
            <span className="text-xs px-2.5 py-1 rounded bg-red-500/20 border border-red-500/40 text-red-300 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Full Attack Chain Identified
            </span>
          )}
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Phase: {progressionState.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Visual Chain Flow */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1 custom-scrollbar">
        {stages.map((stg, idx) => {
          const isSelected = activeStage && activeStage.stage === stg.stage;
          return (
            <React.Fragment key={idx}>
              <div
                onClick={() => setSelectedStage(stg)}
                className={`flex-shrink-0 cursor-pointer p-3 rounded-lg border transition-all min-w-[150px] ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-slate-400">{stg.timestamp}s</span>
                  <span className={`px-1.5 py-0.2 rounded border text-[10px] font-semibold ${getSeverityBadge(stg.severity)}`}>
                    {stg.severity}
                  </span>
                </div>
                <div className="font-medium text-xs text-slate-200 line-clamp-1">{stg.title}</div>
                <div className="text-[11px] text-slate-400 mt-1 truncate">"{stg.evidence[0]}"</div>
              </div>

              {idx < stages.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Stage Detail Card */}
      {activeStage && (
        <div className="mt-2 bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Stage Detail: {activeStage.title}
            </span>
            <span className="text-slate-400 font-mono">Confidence: {Math.round(activeStage.confidence * 100)}%</span>
          </div>
          <p className="text-slate-300 mb-2 leading-relaxed">{activeStage.description}</p>
          <div className="bg-slate-900/80 p-2 rounded border border-slate-800 font-mono text-amber-200">
            <span className="text-slate-400">Supporting Evidence: </span>
            {activeStage.evidence.map((ev, i) => (
              <span key={i}>"{ev}" </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
