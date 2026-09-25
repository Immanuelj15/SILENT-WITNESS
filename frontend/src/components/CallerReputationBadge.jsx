import React from 'react';
import { PhoneCall, ShieldAlert, CheckCircle2, AlertTriangle, Building, User } from 'lucide-react';

export default function CallerReputationBadge({ callerReputation }) {
  if (!callerReputation) return null;

  const { risk_tier, label, reputation_score, baseline_trust_score, is_spoof_risk, telecom_carrier } = callerReputation;

  const getTierBadge = () => {
    switch (risk_tier) {
      case 'KNOWN_CONTACT':
        return {
          icon: User,
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          title: 'Known Saved Contact'
        };
      case 'VERIFIED_BUSINESS':
        return {
          icon: Building,
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          title: 'Verified Enterprise Caller ID'
        };
      case 'SUSPECTED_ROBOCALL':
        return {
          icon: ShieldAlert,
          color: 'bg-red-500/10 text-red-400 border-red-500/30',
          title: 'Suspected Autodialer / Telemarketer'
        };
      default:
        return {
          icon: PhoneCall,
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          title: 'Unknown Number'
        };
    }
  };

  const badge = getTierBadge();
  const Icon = badge.icon;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg border ${badge.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{label}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badge.color}`}>
              {risk_tier}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {callerReputation.phone_number} • {telecom_carrier}
          </span>
        </div>
      </div>

      <div className="text-right">
        <div className="text-[11px] text-slate-400">Baseline Prior:</div>
        <div className="font-mono font-bold text-slate-200">
          Trust {baseline_trust_score}/100
        </div>
        {is_spoof_risk && (
          <span className="text-[10px] text-amber-400 flex items-center justify-end gap-1">
            <AlertTriangle className="w-3 h-3" /> Spoof risk
          </span>
        )}
      </div>
    </div>
  );
}
