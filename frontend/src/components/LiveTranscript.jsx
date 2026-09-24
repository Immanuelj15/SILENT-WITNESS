import React, { useRef, useEffect, useState } from 'react';
import { MessageSquare, User, PhoneCall, ListFilter } from 'lucide-react';

export default function LiveTranscript({
  transcript = '',
  dialogueTurns = [],
  evidence = [],
  suspiciousPhrases = [],
  isProvisional = false,
  easyMode = false
}) {
  const scrollRef = useRef(null);
  const [viewMode, setViewMode] = useState('turns'); // 'turns' or 'raw'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, dialogueTurns]);

  const highlightPhraseInText = (text) => {
    if (!evidence || evidence.length === 0) return text;
    const sorted = [...evidence].sort((a, b) => b.exact_phrase.length - a.exact_phrase.length);

    let parts = [{ text, isFlagged: false, tag: null }];

    sorted.forEach(item => {
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

    return parts.map((p, i) => {
      if (!p.isFlagged) return <span key={i}>{p.text}</span>;
      let className = 'highlight-claim';
      const lt = (p.tag || '').toLowerCase();
      if (lt.includes('otp') || lt.includes('pin') || lt.includes('credential')) {
        className = 'highlight-credential';
      } else if (lt.includes('threat') || lt.includes('urgency') || lt.includes('scam')) {
        className = 'highlight-threat';
      }
      return <mark key={i} className={className} title={p.tag}>{p.text}</mark>;
    });
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} color="var(--accent-indigo)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Live Speech Transcript (Diarized)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setViewMode(viewMode === 'turns' ? 'raw' : 'turns')}
            className="btn-secondary"
            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
          >
            <ListFilter size={12} /> {viewMode === 'turns' ? 'Diarized Turns' : 'Raw Stream'}
          </button>
        </div>
      </div>

      {/* Transcript container */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: '150px',
          maxHeight: '270px',
          overflowY: 'auto',
          background: 'rgba(9, 14, 26, 0.75)',
          padding: '14px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: easyMode ? '1.15rem' : '0.92rem',
          lineHeight: 1.6,
          color: '#e2e8f0'
        }}
      >
        {!transcript && (!dialogueTurns || dialogueTurns.length === 0) ? (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>
            Listening to live speech stream... Speaker-labeled transcription turns will appear in real time.
          </div>
        ) : viewMode === 'turns' && dialogueTurns && dialogueTurns.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dialogueTurns.map((turn, idx) => {
              const isCaller = turn.speaker === 'CALLER';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isCaller ? 'flex-start' : 'flex-end'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: isCaller ? '#38bdf8' : '#34d399', marginBottom: '2px' }}>
                    {isCaller ? <PhoneCall size={12} /> : <User size={12} />}
                    <span style={{ fontWeight: 700 }}>{isCaller ? 'INBOUND CALLER' : 'YOU (USER)'}</span>
                    <span style={{ color: 'var(--text-muted)' }}>+{turn.timestamp_offset}s</span>
                  </div>
                  <div style={{
                    maxWidth: '85%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: isCaller ? 'rgba(30, 41, 59, 0.85)' : 'rgba(16, 185, 129, 0.15)',
                    border: isCaller ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#f8fafc'
                  }}>
                    {highlightPhraseInText(turn.text)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>{highlightPhraseInText(transcript)}</div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
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
