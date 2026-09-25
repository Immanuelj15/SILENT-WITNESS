import React from 'react';
import { Smartphone, MessageSquare, Video, Globe, Shield, AlertTriangle } from 'lucide-react';

export default function ChannelSelector({ selectedChannel, onSelectChannel, capabilities }) {
  const channels = [
    {
      id: 'SIM_CALL',
      label: 'SIM Cellular',
      sub: 'CallScreening API',
      icon: Smartphone,
      color: 'border-cyan-500/40 text-cyan-300'
    },
    {
      id: 'WHATSAPP',
      label: 'WhatsApp / Online',
      sub: 'Screen-Share Shield',
      icon: MessageSquare,
      color: 'border-emerald-500/40 text-emerald-300'
    },
    {
      id: 'VIDEO_CALL',
      label: 'Video Call',
      sub: 'Extortion & Deepfake',
      icon: Video,
      color: 'border-purple-500/40 text-purple-300'
    },
    {
      id: 'OWN_VOIP',
      label: 'Secure WebRTC',
      sub: 'Full Direct Audio/Video',
      icon: Globe,
      color: 'border-blue-500/40 text-blue-300'
    }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Protected Channel
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Universal Communication Layer
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {channels.map((ch) => {
          const Icon = ch.icon;
          const isSelected = selectedChannel === ch.id;

          return (
            <button
              key={ch.id}
              onClick={() => onSelectChannel(ch.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-500 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-950/40'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${ch.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </div>

              <div>
                <span className="text-xs font-bold text-slate-100 block">
                  {ch.label}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                  {ch.sub}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Honest Capability Notice */}
      {capabilities && capabilities.notes && capabilities.notes.length > 0 && (
        <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>{capabilities.notes[0]}</span>
        </div>
      )}
    </div>
  );
}
