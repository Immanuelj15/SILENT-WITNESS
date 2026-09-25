import React from 'react';
import { ShieldAlert, PhoneOff, AlertOctagon, CheckCircle2, Lock } from 'lucide-react';

export default function ScreenShareAlertModal({ isOpen, onClose, screenData, onEndCall }) {
  if (!isOpen || !screenData || !screenData.is_screen_share_demanded) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-red-500/80 w-full max-w-lg rounded-2xl p-6 shadow-2xl shadow-red-950/60 relative overflow-hidden">
        {/* Glowing emergency accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse" />

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 block font-mono">
              Critical Security Warning
            </span>
            <h3 className="text-xl font-extrabold text-white">
              STOP SCREEN SHARING NOW
            </h3>
          </div>
        </div>

        <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-4 mb-4 text-xs text-red-200 leading-relaxed">
          <p className="font-semibold text-sm text-red-100 mb-2">
            The caller is attempting to view or control your device screen.
          </p>
          <p>
            Sharing your screen will immediately expose:
          </p>
          <ul className="mt-2 space-y-1.5 font-medium">
            <li className="flex items-center gap-2 text-red-300">
              <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
              <span>Banking App Balances & UPI PINs</span>
            </li>
            <li className="flex items-center gap-2 text-red-300">
              <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
              <span>Incoming 6-Digit SMS OTP Security Codes</span>
            </li>
            <li className="flex items-center gap-2 text-red-300">
              <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
              <span>Passwords & Private Messages</span>
            </li>
          </ul>
        </div>

        {/* Recommended Action */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs mb-5 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-200 block">Recommended Protocol:</span>
            <span className="text-slate-400">
              Tap 'Stop Sharing' in your call app immediately. Legitimate banks and support agents never ask to view your screen.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            I Stopped Sharing
          </button>
          {onEndCall && (
            <button
              onClick={() => {
                onEndCall();
                onClose();
              }}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 cursor-pointer border border-red-400/40"
            >
              <PhoneOff className="w-4 h-4" /> End Call
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
