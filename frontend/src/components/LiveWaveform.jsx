import React, { useEffect, useState } from 'react';
import { Activity, Mic, MicOff, Waves, Cpu } from 'lucide-react';

export default function LiveWaveform({ isRecording = false, voiceAnalysis = null, duration = 0 }) {
  const [bars, setBars] = useState([12, 24, 45, 18, 60, 30, 80, 50, 25, 40, 70, 90, 45, 65, 30, 20, 55, 35, 15, 25]);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.floor(Math.random() * 85) + 15));
    }, 120);
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isSynthetic = voiceAnalysis?.is_synthetic_suspected;
  const voiceRisk = voiceAnalysis?.voiceRisk || 12;

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Waves size={18} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Acoustic & Deepfake Monitor
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className={isRecording ? 'radar-dot' : 'radar-dot-danger'} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isRecording ? '#34d399' : '#94a3b8' }}>
            {isRecording ? `LIVE AUDIO (${formatDuration(duration)})` : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Waveform Frequency Spectrum */}
      <div style={{
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '0 10px',
        background: 'rgba(7, 11, 20, 0.85)',
        borderRadius: '12px',
        border: '1px solid rgba(56, 189, 248, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }} />

        {bars.map((height, idx) => (
          <div
            key={idx}
            style={{
              width: '6px',
              height: isRecording ? `${height}%` : '8%',
              background: isSynthetic
                ? 'linear-gradient(180deg, #ef4444 0%, #f97316 100%)'
                : 'linear-gradient(180deg, #06b6d4 0%, #3b82f6 100%)',
              borderRadius: '3px',
              transition: 'height 0.12s ease',
              boxShadow: isRecording
                ? (isSynthetic ? '0 0 8px rgba(239, 68, 68, 0.5)' : '0 0 8px rgba(6, 182, 212, 0.4)')
                : 'none'
            }}
          />
        ))}
      </div>

      {/* Acoustic Deepfake Diagnostics */}
      <div style={{
        marginTop: '14px',
        padding: '12px',
        borderRadius: '10px',
        background: isSynthetic ? 'rgba(239, 68, 68, 0.12)' : 'rgba(15, 23, 42, 0.6)',
        border: isSynthetic ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={20} color={isSynthetic ? '#ef4444' : '#06b6d4'} />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isSynthetic ? '#fca5a5' : '#e2e8f0' }}>
              {isSynthetic ? 'Synthetic Voice Characteristics Detected' : 'Voice Authenticity: Human Profile Normal'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {voiceAnalysis?.indicators?.[0] || 'Acoustic pitch and spectral continuity stable'}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Acoustic Risk</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isSynthetic ? '#ef4444' : '#10b981' }}>
            {voiceRisk}%
          </div>
        </div>
      </div>
    </div>
  );
}
