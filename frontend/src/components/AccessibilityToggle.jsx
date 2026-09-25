import React from 'react';
import { Eye, Ear, Sparkles } from 'lucide-react';

export default function AccessibilityToggle({ activeMode, onModeChange }) {
  const modes = [
    { id: 'standard', label: 'Standard UI', icon: Sparkles },
    { id: 'cognitive', label: 'Cognitive Mode', icon: Eye, desc: 'Simplified, large text, distraction-free' },
    { id: 'hearing', label: 'Hearing Assist', icon: Ear, desc: 'Captions-first, prominent visual alerts' },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            title={mode.desc}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
              isActive
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
