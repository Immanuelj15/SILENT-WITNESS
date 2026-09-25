import React from 'react';
import { ShieldCheck, AlertCircle, HelpCircle, MessageSquare } from 'lucide-react';

export default function CoachingPromptCard({ coaching, isCompact = false }) {
  if (!coaching) return null;

  const isCritical = coaching.priority === 'CRITICAL';
  const isHigh = coaching.priority === 'HIGH';

  const badgeColor = isCritical
    ? 'bg-red-500/20 text-red-300 border-red-500/40'
    : isHigh
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    : 'bg-blue-500/20 text-blue-300 border-blue-500/40';

  if (isCompact) {
    return (
      <div className={`p-3 rounded-xl border ${isCritical ? 'border-red-500/40 bg-red-950/20' : 'border-indigo-500/30 bg-slate-900/60'} backdrop-blur-sm`}>
        <div className="flex items-center gap-2 mb-1.5">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-200">Recommended Response:</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeColor}`}>
            {coaching.priority}
          </span>
        </div>
        <p className="text-xs text-amber-200/90 font-medium italic">
          "{coaching.recommended_script}"
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Live Defensive Coaching</h4>
            <p className="text-[11px] text-slate-400">Contextual verbal tactics to defuse coercion</p>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${badgeColor}`}>
          {coaching.priority} DEFENSE
        </span>
      </div>

      <div className="space-y-3">
        {/* Recommended Safe Script */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-amber-300">Say This Right Now:</span>
          </div>
          <p className="text-sm text-slate-100 font-semibold leading-relaxed">
            {coaching.recommended_script}
          </p>
        </div>

        {/* Counter Trap Question */}
        {coaching.trap_question && (
          <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-medium text-indigo-300">Identity Test Question:</span>
            </div>
            <p className="text-xs text-indigo-100">
              {coaching.trap_question}
            </p>
          </div>
        )}

        {/* Rationale */}
        {coaching.rationale && (
          <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
            <span><strong className="text-slate-300">Why this works:</strong> {coaching.rationale}</span>
          </div>
        )}
      </div>
    </div>
  );
}
