import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle2, X, MessageSquare, AlertTriangle } from 'lucide-react';

export default function UserFeedbackModal({ isOpen = false, onClose = null, callId = '' }) {
  const [selectedLabel, setSelectedLabel] = useState('FALSE_ALARM');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_id: callId || 'live_call_session',
          user_label: selectedLabel,
          notes: notes
        })
      });
      const data = await res.json();
      setSubmittedMessage(data.message || 'Feedback recorded.');
      setTimeout(() => {
        setSubmittedMessage('');
        setIsSubmitting(false);
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '24px', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
          User Safety Feedback Loop
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Help calibrate the detection thresholds by confirming whether the call was genuinely fraudulent or a false alarm.
        </p>

        {submittedMessage ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#34d399' }}>
            <CheckCircle2 size={36} style={{ margin: '0 auto 8px', display: 'block' }} />
            <div>{submittedMessage}</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setSelectedLabel('FALSE_ALARM')}
                className="btn-secondary"
                style={{
                  justifyContent: 'center',
                  borderColor: selectedLabel === 'FALSE_ALARM' ? '#10b981' : 'var(--border-glass)',
                  background: selectedLabel === 'FALSE_ALARM' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.7)'
                }}
              >
                <ThumbsUp size={16} color="#10b981" /> False Alarm
              </button>
              <button
                type="button"
                onClick={() => setSelectedLabel('SCAM')}
                className="btn-secondary"
                style={{
                  justifyContent: 'center',
                  borderColor: selectedLabel === 'SCAM' ? '#ef4444' : 'var(--border-glass)',
                  background: selectedLabel === 'SCAM' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.7)'
                }}
              >
                <ThumbsDown size={16} color="#ef4444" /> Confirmed Scam
              </button>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional feedback (e.g., 'Legitimate appointment from doctor' or 'Impersonated electric company')..."
              rows={3}
              style={{
                width: '100%',
                background: 'rgba(9, 14, 26, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '10px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                marginBottom: '16px',
                resize: 'none'
              }}
            />

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isSubmitting}>
              {isSubmitting ? 'Recording Feedback...' : 'Submit Calibration Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
