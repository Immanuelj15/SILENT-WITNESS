import React, { useRef, useEffect } from 'react';
import { MessageSquare, AlertCircle, Sparkles } from 'lucide-react';

export default function LiveTranscript({ transcript = '', evidence = [], suspiciousPhrases = [], isProvisional = false, easyMode = false }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Highlight suspicious phrases within text
  const renderHighlightedTranscript = () => {
    if (!transcript) {
      return (
        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>
          Listening to live conversation stream... Speech transcription will appear here in real time.
        </div>
      );
    }

    if (!evidence || evidence.length === 0) {
      return <span>{transcript}</span>;
    }

    // Sort evidence by length descending to match longer multi-word phrases first
    const sortedEvidence = [...evidence].sort((a, b) => b.exact_phrase.length - a.exact_phrase.length);

    let parts = [{ text: transcript, isFlagged: false, tag: null }];

    sortedEvidence.forEach(item => {
      const phrase = item.exact_phrase;
      if (!phrase) return;

      const nextParts = [];
      parts.forEach(part => {
        if (part.isFlagged) {
          nextParts.push(part);
          return;
        }

        const idx = part.text.toLowerCase().indexOf(phrase.toLowerCase());
        if (idx === -1) {
          nextParts.push(part);
        } else {
          const before = part.text.substring(0, idx);
          const matched = part.text.substring(idx, idx + phrase.length);
          const after = part.text.substring(idx + phrase.length);

          if (before) nextParts.push({ text: before, isFlagged: false, tag: null });
          nextParts.push({ text: matched, isFlagged: true, tag: item.detected_tag });
          if (after) nextParts.push({ text: after, isFlagged: false, tag: null });
        }
      });
      parts = nextParts;
    });

    return (
      <span>
        {parts.map((part, i) => {
          if (!part.isFlagged) {
            return <span key={i}>{part.text}</span>;
          }

          let className = 'highlight-claim';
          const lowerTag = (part.tag || '').toLowerCase();
          if (lowerTag.includes('otp') || lowerTag.includes('pin') || lowerTag.includes('credential')) {
            className = 'highlight-credential';
          } else if (lowerTag.includes('threat') || lowerTag.includes('urgency') || lowerTag.includes('scam')) {
            className = 'highlight-threat';
          }

          return (
            <mark
              key={i}
              className={className}
              title={`Flagged as: ${part.tag}`}
            >
              {part.text}
            </mark>
          );
        })}
      </span>
    );
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} color="var(--accent-indigo)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Live Speech Transcript
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Phrases highlighted in real-time
          </span>
        </div>
      </div>

      {/* Transcript container */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: '140px',
          maxHeight: '260px',
          overflowY: 'auto',
          background: 'rgba(9, 14, 26, 0.75)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: easyMode ? '1.15rem' : '0.95rem',
          lineHeight: 1.7,
          color: '#e2e8f0'
        }}
      >
        {renderHighlightedTranscript()}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '2px' }} />
          <span>Threat / Urgency</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '10px', background: '#f59e0b', borderRadius: '2px' }} />
          <span>Credential / OTP Request</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '10px', background: '#818cf8', borderRadius: '2px' }} />
          <span>Unverified Identity Claim</span>
        </div>
      </div>
    </div>
  );
}
