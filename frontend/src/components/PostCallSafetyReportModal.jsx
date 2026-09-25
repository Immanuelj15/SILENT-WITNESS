import React, { useState } from 'react';
import { FileText, Download, Share2, ShieldAlert, CheckCircle, Clock, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function PostCallSafetyReportModal({ isOpen, onClose, reportData }) {
  const [privacySafeMode, setPrivacySafeMode] = useState(true);

  if (!isOpen || !reportData) return null;

  const {
    reportId,
    callId,
    generatedAt,
    callSummary = {},
    majorRiskSignals = [],
    scamIntentChain = {},
    attackTimeline = [],
    callerIdentityAudit = {},
    recommendedActions = [],
    privacySafeSummary = {}
  } = reportData;

  const isScam = callSummary.finalClassification === 'CRITICAL' || callSummary.finalClassification === 'HIGH_RISK';

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SilentWitness_SafetyReport_${callId || 'Call'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    const textToCopy = privacySafeMode
      ? privacySafeSummary.summaryText
      : `SILENT WITNESS CALL REPORT: ${callSummary.finalClassification} (Trust: ${callSummary.trustScore}/100, Risk: ${callSummary.riskScore}/100). Category: ${callSummary.scamCategory}. Major signals: ${majorRiskSignals.join(', ')}. Actions: ${recommendedActions.join('; ')}`;
    navigator.clipboard.writeText(textToCopy);
    alert('Safety summary copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isScam ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Post-Call Safety Intelligence Report</h3>
              <p className="text-xs text-slate-400">
                Report ID: <span className="font-mono text-cyan-300">{reportId}</span> | Generated: {new Date(generatedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrivacySafeMode(!privacySafeMode)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition"
            >
              {privacySafeMode ? <EyeOff className="w-3.5 h-3.5 text-cyan-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
              {privacySafeMode ? 'Sanitized View' : 'Full Transcript View'}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-lg px-2.5 py-1 rounded-lg hover:bg-slate-800 transition"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-5 text-xs">
          {/* Executive KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-slate-400 block text-[11px]">Final Classification</span>
              <span className={`text-base font-bold font-mono mt-0.5 block ${
                isScam ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {callSummary.finalClassification}
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-slate-400 block text-[11px]">Trust Score</span>
              <span className="text-xl font-bold font-mono text-cyan-400 mt-0.5 block">
                {callSummary.trustScore} / 100
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-slate-400 block text-[11px]">Risk Assessment</span>
              <span className="text-xl font-bold font-mono text-amber-400 mt-0.5 block">
                {callSummary.riskScore} / 100
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-slate-400 block text-[11px]">Duration & Language</span>
              <span className="text-sm font-semibold text-slate-200 mt-0.5 block">
                {callSummary.durationFormatted} ({callSummary.primaryLanguage})
              </span>
            </div>
          </div>

          {/* Privacy-Safe Sanitized Summary Box */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Executive Safety Summary
            </h4>
            <p className="text-slate-300 leading-relaxed font-sans">
              {privacySafeSummary.summaryText}
            </p>
          </div>

          {/* Top Threat Signals */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Primary Verified Risk Signals
            </h4>
            <div className="flex flex-wrap gap-2">
              {majorRiskSignals.map((sig, i) => (
                <span key={i} className="px-2.5 py-1 rounded bg-red-950/40 text-red-300 border border-red-900/60 font-medium">
                  ⚠ {sig}
                </span>
              ))}
            </div>
          </div>

          {/* Identity & Attack Progression Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Identity Audit */}
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Caller Identity Audit
              </h4>
              <div className="space-y-1.5">
                <div>
                  <span className="text-slate-400">Claimed Organization: </span>
                  <span className="font-semibold text-slate-200">{callerIdentityAudit.claimedOrganization || 'Unclaimed'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Verification Status: </span>
                  <span className="font-mono text-amber-300 font-bold">{callerIdentityAudit.verificationStatus}</span>
                </div>
                {callerIdentityAudit.contradictions && callerIdentityAudit.contradictions.length > 0 && (
                  <div className="mt-2 text-red-300 bg-red-950/30 p-2 rounded border border-red-900/40">
                    {callerIdentityAudit.contradictions[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Attack Chain Summary */}
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Scam Intent Progression
              </h4>
              <div className="space-y-1 text-slate-300">
                {scamIntentChain.stages && scamIntentChain.stages.length > 0 ? (
                  scamIntentChain.stages.map((stg, i) => (
                    <div key={i} className="flex justify-between items-center py-0.5">
                      <span>• {stg.title}</span>
                      <span className="font-mono text-slate-400 text-[11px]">{stg.timestamp}s</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">No formal multi-stage scam chain observed.</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Recommendations */}
          <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Prescribed User Safety Protocols
            </h4>
            <ul className="space-y-1.5 text-slate-200 list-disc list-inside">
              {recommendedActions.map((act, i) => (
                <li key={i} className="font-medium">{act}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 pt-4 mt-5 flex justify-between items-center flex-wrap gap-2">
          <div className="flex gap-2">
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export Full JSON
            </button>
            <button
              onClick={handleCopySummary}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              Copy Safety Summary
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
