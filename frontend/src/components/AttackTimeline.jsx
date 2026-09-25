import React, { useState } from 'react';
import { Clock, ShieldAlert, AlertTriangle, ArrowRight, HelpCircle } from 'lucide-react';

export default function AttackTimeline({ timeline = [] }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-200">Conversation Attack Timeline</h3>
        </div>
        <p className="text-sm text-slate-400 italic">
          Listening to conversation... Attack progression events will appear chronologically here.
        </p>
      </div>
    );
  }

  const activeSelected = selectedEvent || timeline[timeline.length - 1];

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Conversation Attack Timeline</h3>
            <p className="text-[11px] text-slate-400">Chronological forensic events with risk attribution</p>
          </div>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
          {timeline.length} {timeline.length === 1 ? 'Event' : 'Events'} Logged
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Timeline Event Sequence */}
        <div className="lg:col-span-7 space-y-2.5 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
          {timeline.map((evt, idx) => {
            const isSelected = activeSelected && activeSelected.timestamp === evt.timestamp;
            const isHighRisk = evt.riskDelta >= 25;

            return (
              <div
                key={idx}
                onClick={() => setSelectedEvent(evt)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 shadow-sm ${
                  isSelected
                    ? 'bg-slate-800/90 border-indigo-500 ring-1 ring-indigo-500/50 shadow-indigo-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="mt-0.5">
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-semibold block">
                    {evt.timeFormatted || `T+${Math.floor(evt.timestamp)}s`}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-100 truncate">
                      {evt.label || evt.eventType}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                        isHighRisk
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {evt.riskContribution}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-1 mt-1 font-sans italic bg-slate-900/60 px-2 py-1 rounded border border-slate-800/60">
                    "{evt.evidence}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Event Details (Why This Matters) */}
        <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 flex flex-col justify-between">
          {activeSelected ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Why This Matters
                </h4>
              </div>

              <div className="mb-3">
                <span className="text-xs text-slate-400">Event:</span>
                <p className="text-sm font-medium text-slate-200">
                  {activeSelected.label || activeSelected.eventType}
                </p>
              </div>

              <div className="mb-3">
                <span className="text-xs text-slate-400">Verbatim Evidence:</span>
                <p className="text-xs font-mono text-amber-200 bg-amber-950/20 p-2 rounded border border-amber-900/40 mt-1">
                  "{activeSelected.evidence}"
                </p>
              </div>

              <div className="mb-3">
                <span className="text-xs text-slate-400">Inferred Attack Intent:</span>
                <p className="text-xs text-indigo-300 font-medium mt-0.5">
                  {activeSelected.intent}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-400">Psychological Impact:</span>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {activeSelected.whyThisMatters}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Select an event to view explanation.</p>
          )}

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Confidence: {activeSelected ? `${Math.round(activeSelected.confidence * 100)}%` : '--'}</span>
            <span className="text-rose-400 font-medium">Deterministic Attribution</span>
          </div>
        </div>
      </div>
    </div>
  );
}
