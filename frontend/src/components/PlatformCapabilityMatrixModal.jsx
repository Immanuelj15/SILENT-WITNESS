import React, { useState, useEffect } from 'react';
import { X, Shield, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export default function PlatformCapabilityMatrixModal({ isOpen, onClose }) {
  const [capabilities, setCapabilities] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const fetchCapabilities = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/platforms/capabilities');
        if (res.ok) {
          const data = await res.json();
          setCapabilities(data);
        }
      } catch (e) {
        console.error("Failed to load capabilities:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCapabilities();
  }, [isOpen]);

  if (!isOpen) return null;

  const renderStatus = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3 text-emerald-400" /> Active
          </span>
        );
      case 'LIMITED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> Conditional
          </span>
        );
      case 'PLATFORM_RESTRICTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
            <XCircle className="w-3 h-3 text-red-400" /> Platform Restricted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            Unavailable
          </span>
        );
    }
  };

  const rows = [
    { key: 'caller_screening', label: 'Caller Screening & Number Reputation' },
    { key: 'caller_id_metadata', label: 'Caller Identity Plausibility' },
    { key: 'audio_analysis', label: 'Live Audio Stream Capture' },
    { key: 'speech_to_text', label: 'Streaming Speech-to-Text' },
    { key: 'voice_authenticity', label: 'Voice Deepfake Detection' },
    { key: 'video_deepfake_analysis', label: 'Video Deepfake & Lip-Sync Analysis' },
    { key: 'screen_share_detection', label: 'Screen Share Coercion Detection' },
    { key: 'full_conversation_analysis', label: 'Full Multi-Agent Risk Engine' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Platform Capability & Technical Honesty Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Transparent boundary disclosures conforming to Android OS & messaging security models
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
              <Info className="w-4 h-4" /> Technical Rule: No Falsified Capabilities
            </span>
            Silent Witness explicitly distinguishes between native cellular call screening, platform-restricted third-party encrypted audio (WhatsApp), and fully accessible WebRTC VoIP channels.
          </div>

          {loading || !capabilities ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading runtime capability matrix...
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <th className="p-3.5">Security Capability</th>
                    <th className="p-3.5">SIM Cellular</th>
                    <th className="p-3.5">WhatsApp / Online</th>
                    <th className="p-3.5">Video Call</th>
                    <th className="p-3.5">Own WebRTC VoIP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="p-3.5 font-medium text-slate-200">
                        {r.label}
                      </td>
                      <td className="p-3.5">
                        {renderStatus(capabilities.SIM_CALL?.[r.key])}
                      </td>
                      <td className="p-3.5">
                        {renderStatus(capabilities.WHATSAPP?.[r.key])}
                      </td>
                      <td className="p-3.5">
                        {renderStatus(capabilities.VIDEO_CALL?.[r.key])}
                      </td>
                      <td className="p-3.5">
                        {renderStatus(capabilities.OWN_VOIP?.[r.key])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
}
