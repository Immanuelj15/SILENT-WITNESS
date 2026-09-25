import React, { useState } from 'react';
import { UserCheck, ShieldAlert, AlertOctagon, PhoneCall, CheckCircle2, HelpCircle } from 'lucide-react';

export default function IdentityVerificationPanel({ identityAudit }) {
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  if (!identityAudit) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-3">
          <UserCheck className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-slate-200">Caller Identity Verification</h3>
        </div>
        <p className="text-sm text-slate-400 italic">
          No explicit authority or organizational identity claimed yet.
        </p>
      </div>
    );
  }

  const {
    claimedOrganization,
    claimedRole,
    verificationStatus,
    contradictions = [],
    officialDirectoryContact,
    recommendedAction
  } = identityAudit;

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'VERIFIED':
        return {
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          label: 'VERIFIED OFFICIAL'
        };
      case 'CONTRADICTED':
        return {
          bg: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse',
          icon: <AlertOctagon className="w-4 h-4 text-red-400" />,
          label: 'CONTRADICTION DETECTED'
        };
      case 'UNVERIFIED':
        return {
          bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
          label: 'CLAIMED - NOT VERIFIED'
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <HelpCircle className="w-4 h-4 text-slate-400" />,
          label: 'UNKNOWN'
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Caller Identity Verification</h3>
            <p className="text-[11px] text-slate-400">Institutional directory & behavioral policy audit</p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full border text-xs font-bold tracking-wider flex items-center gap-1.5 ${badge.bg}`}>
          {badge.icon}
          <span>{badge.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Left Column: Claims */}
        <div className="space-y-2.5 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Claimed Role / Persona:</span>
            <span className="text-sm font-semibold text-slate-200 font-sans mt-0.5 block">
              {claimedRole || 'Inbound Caller'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Claimed Organization:</span>
            <span className="text-sm font-bold text-cyan-300 font-mono mt-0.5 block">
              {claimedOrganization || 'Unspecified / Individual'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Official Directory Policy:</span>
            <p className="text-slate-300 italic mt-0.5 leading-relaxed">
              Official entities never ask for OTPs or PINs over the phone.
            </p>
          </div>
        </div>

        {/* Right Column: Contradictions & Actions */}
        <div className="flex flex-col justify-between bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold mb-1.5">Behavioral Audit Findings:</span>
            {contradictions.length > 0 ? (
              <div className="space-y-1.5">
                {contradictions.map((c, i) => (
                  <div key={i} className="text-red-300 bg-red-950/30 p-2.5 rounded-lg border border-red-900/50 leading-relaxed font-medium">
                    ⚠ {c}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-300 leading-relaxed">
                {recommendedAction || 'No behavioral policy violations recorded yet.'}
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={() => setShowVerifyModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-cyan-900/20 flex items-center gap-2 cursor-pointer border border-cyan-400/30"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Verify Official Contact
            </button>
            <span className="text-[11px] text-slate-500 font-mono">Zero Trust Protocol</span>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 shadow-2xl">
            <h4 className="text-base font-bold text-slate-100 mb-2 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-cyan-400" />
              Safe Caller Verification Workflow
            </h4>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Never accept inbound caller assertions at face value. Follow the official protocol:
            </p>

            <div className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs mb-4">
              <div>
                <span className="text-slate-400 block">Claimed Organization:</span>
                <span className="text-sm font-semibold text-cyan-300">{claimedOrganization || 'General Bank / Service'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Official Verified Directory Number:</span>
                <span className="text-sm font-mono text-emerald-400 font-bold">
                  {officialDirectoryContact || 'Check rear of debit card or visit official website'}
                </span>
              </div>
              <div className="text-amber-300 bg-amber-950/30 p-2.5 rounded border border-amber-900/50">
                🔒 <strong>Rule:</strong> Never call numbers or click links given by the suspicious caller. Hang up and dial the official number yourself.
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
