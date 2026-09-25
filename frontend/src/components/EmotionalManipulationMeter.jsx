import React from 'react';
import { Activity, Flame, Clock, UserX, AlertTriangle, HeartPulse } from 'lucide-react';

export default function EmotionalManipulationMeter({ emotionData }) {
  if (!emotionData) return null;

  const score = emotionData.emotional_manipulation_score || 0;
  const vectors = emotionData.vector_breakdown || { fear: 0, urgency: 0, intimidation: 0, isolation: 0 };
  const dominant = emotionData.dominant_tactic || 'Normal Conversation';
  const userStress = emotionData.user_stress_score || 0;
  const hesitationDetected = emotionData.user_hesitation_detected || false;

  const getScoreColor = (val) => {
    if (val >= 60) return 'text-red-400';
    if (val >= 30) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getBarColor = (val) => {
    if (val >= 60) return 'bg-gradient-to-r from-amber-500 to-red-500';
    if (val >= 30) return 'bg-gradient-to-r from-blue-500 to-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Emotional Manipulation Sub-Score</h4>
            <p className="text-[11px] text-slate-400">Psychological coercion tracking independent of speech content</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold font-mono ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-xs text-slate-500 font-mono">/100</span>
        </div>
      </div>

      {/* Dominant vector tag */}
      <div className="mb-4 flex items-center justify-between text-xs bg-slate-800/40 px-3 py-2 rounded-xl border border-slate-700/50">
        <span className="text-slate-400">Dominant Coercion Tactic:</span>
        <span className="font-semibold text-purple-300 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-purple-400" />
          {dominant}
        </span>
      </div>

      {/* 4 Vector breakdown */}
      <div className="space-y-2.5 mb-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-400" /> Fear & Intimidation
            </span>
            <span className="font-mono text-slate-400">{vectors.fear}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${getBarColor(vectors.fear)}`} style={{ width: `${vectors.fear}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" /> Artificial Urgency
            </span>
            <span className="font-mono text-slate-400">{vectors.urgency}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${getBarColor(vectors.urgency)}`} style={{ width: `${vectors.urgency}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300 flex items-center gap-1">
              <Flame className="w-3 h-3 text-indigo-400" /> Authority Coercion
            </span>
            <span className="font-mono text-slate-400">{vectors.intimidation}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${getBarColor(vectors.intimidation)}`} style={{ width: `${vectors.intimidation}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300 flex items-center gap-1">
              <UserX className="w-3 h-3 text-pink-400" /> Social Isolation
            </span>
            <span className="font-mono text-slate-400">{vectors.isolation}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${getBarColor(vectors.isolation)}`} style={{ width: `${vectors.isolation}%` }} />
          </div>
        </div>
      </div>

      {/* User Stress / Hesitation Alert */}
      <div className={`p-3 rounded-xl border flex items-center justify-between ${hesitationDetected ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-800/30 border-slate-700/40'}`}>
        <div className="flex items-center gap-2">
          <HeartPulse className={`w-4 h-4 ${hesitationDetected ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-xs text-slate-200">User Hesitation / Latency Stress:</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">
            {emotionData.user_vulnerability_level || 'LOW'} VULNERABILITY
          </span>
          <span className="text-xs font-mono text-slate-400">({userStress}%)</span>
        </div>
      </div>
    </div>
  );
}
