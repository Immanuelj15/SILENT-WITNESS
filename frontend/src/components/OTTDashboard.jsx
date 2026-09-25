import './OTTDashboard.css';
import { useState, useEffect, useRef, useCallback } from 'react';

const CHANNEL_LABELS = {
  WHATSAPP: { label: 'WhatsApp', icon: '💬', color: '#25D366' },
  TELEGRAM: { label: 'Telegram', icon: '✈️', color: '#2CA5E0' },
  VOIP: { label: 'VoIP Call', icon: '📞', color: '#6C63FF' },
  OWN_VOIP: { label: 'Secure VoIP', icon: '🔒', color: '#00D4AA' },
};

const CALL_ORIGINS = [
  { value: 'DIRECT_DIAL', label: 'Unknown direct call' },
  { value: 'KNOWN_CONTACT', label: 'Known contact' },
  { value: 'SAVED_CONTACT', label: 'Saved contact' },
  { value: 'UNSOLICITED_CHAT', label: 'After unsolicited message' },
  { value: 'BROADCAST', label: 'From broadcast list' },
  { value: 'FORWARDED_LINK', label: 'Via forwarded link' },
  { value: 'GROUP_ADD', label: 'Via group add' },
];

const RISK_COLORS = {
  CRITICAL: { bg: '#FF1744', text: '#FFFFFF', border: '#FF1744', glow: 'rgba(255,23,68,0.4)' },
  HIGH_RISK: { bg: '#FF6D00', text: '#FFFFFF', border: '#FF6D00', glow: 'rgba(255,109,0,0.4)' },
  SUSPICIOUS: { bg: '#FFD600', text: '#1A1A2E', border: '#FFD600', glow: 'rgba(255,214,0,0.3)' },
  GUARDED: { bg: '#2979FF', text: '#FFFFFF', border: '#2979FF', glow: 'rgba(41,121,255,0.3)' },
  SAFE: { bg: '#00E676', text: '#1A1A2E', border: '#00E676', glow: 'rgba(0,230,118,0.3)' },
};

function RiskGauge({ riskScore, trustScore, classification, severityLabel }) {
  const colors = RISK_COLORS[classification] || RISK_COLORS.SAFE;
  const pct = riskScore / 100;
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct);

  return (
    <div className="ott-gauge-wrapper">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <defs>
          <filter id="gaugeglow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
        {/* Progress */}
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={colors.bg}
          strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          filter="url(#gaugeglow)"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease' }}
        />
        {/* Inner text */}
        <text x="70" y="62" textAnchor="middle" fill={colors.bg} fontSize="28" fontWeight="800" fontFamily="Inter,sans-serif">
          {riskScore}
        </text>
        <text x="70" y="78" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="Inter,sans-serif">
          RISK SCORE
        </text>
        <text x="70" y="93" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="Inter,sans-serif">
          TRUST: {trustScore}
        </text>
      </svg>
      <div className="ott-gauge-label" style={{ color: colors.bg, textShadow: `0 0 12px ${colors.glow}` }}>
        {severityLabel || classification}
      </div>
    </div>
  );
}

function FastPathAlert({ alert, onAction }) {
  const [visible, setVisible] = useState(true);
  if (!alert || !visible) return null;

  return (
    <div className="ott-fastpath-overlay">
      <div className="ott-fastpath-card">
        <div className="ott-fastpath-pulse" />
        <div className="ott-fastpath-header">
          <span className="ott-fastpath-icon">🚨</span>
          <h2 className="ott-fastpath-title">{alert.title}</h2>
        </div>
        <ul className="ott-fastpath-bullets">
          {(alert.bullets || []).map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
        <div className="ott-fastpath-actions">
          {(alert.emergency_actions || []).map((action) => (
            <button
              key={action.id}
              className={`ott-action-btn ott-action-${action.severity}`}
              onClick={() => onAction && onAction(action.id)}
            >
              {action.label}
            </button>
          ))}
          <button
            className="ott-action-btn ott-action-dismiss"
            onClick={() => setVisible(false)}
          >
            DISMISS (KEEP MONITORING)
          </button>
        </div>
      </div>
    </div>
  );
}

function IdentityBadge({ identity }) {
  if (!identity) return null;
  const tier = identity.risk_tier;
  const tierColors = {
    HIGH: '#FF1744', MEDIUM: '#FF6D00', LOW: '#FFD600', MINIMAL: '#00E676'
  };
  const color = tierColors[tier] || '#888';

  return (
    <div className="ott-identity-badge">
      <div className="ott-identity-row">
        <span className="ott-id-label">Caller Identity Risk</span>
        <span className="ott-id-value" style={{ color }}>{identity.risk_tier}</span>
      </div>
      <div className="ott-id-score-bar">
        <div
          className="ott-id-score-fill"
          style={{
            width: `${identity.identity_risk_score}%`,
            background: color,
          }}
        />
      </div>
      <div className="ott-id-signals">
        {(identity.risk_factors || []).slice(0, 3).map((f, i) => (
          <div key={i} className="ott-id-signal">⚠ {f.split(':')[0]}</div>
        ))}
        {(identity.risk_deductions || []).slice(0, 2).map((d, i) => (
          <div key={i} className="ott-id-signal ott-id-green">✓ {d.split(':')[0]}</div>
        ))}
      </div>
    </div>
  );
}

function AttributionBar({ attribution }) {
  if (!attribution) return null;
  const entries = Object.entries(attribution)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  const colors = {
    screen_share_contribution: '#FF1744',
    video_extortion_contribution: '#FF6D00',
    identity_contribution: '#FFD600',
    nlp_contribution: '#AA00FF',
    link_file_contribution: '#FF4081',
    voice_contribution: '#2979FF',
    ott_phrase_bonus: '#00BCD4',
  };

  const labels = {
    screen_share_contribution: 'Screen Share',
    video_extortion_contribution: 'Video Extortion',
    identity_contribution: 'Caller Identity',
    nlp_contribution: 'Conversation AI',
    link_file_contribution: 'Links/Files',
    voice_contribution: 'Voice Risk',
    ott_phrase_bonus: 'OTT Scam Phrases',
  };

  return (
    <div className="ott-attribution">
      <h4 className="ott-section-title">Risk Attribution</h4>
      {entries.map(([key, val]) => (
        <div key={key} className="ott-attr-row">
          <span className="ott-attr-label">{labels[key] || key}</span>
          <div className="ott-attr-track">
            <div
              className="ott-attr-fill"
              style={{ width: `${Math.min(100, val)}%`, background: colors[key] || '#888' }}
            />
          </div>
          <span className="ott-attr-val">{val.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

function OTTSignalPills({ signals }) {
  if (!signals || signals.length === 0) return null;
  return (
    <div className="ott-signals-row">
      <span className="ott-signals-label">OTT Signals:</span>
      <div className="ott-pills">
        {signals.map((s, i) => (
          <span key={i} className="ott-pill">{s}</span>
        ))}
      </div>
    </div>
  );
}

function ScreenShareBanner({ active, coercionDetected }) {
  if (!active && !coercionDetected) return null;
  return (
    <div className={`ott-screen-banner ${active ? 'ott-screen-active' : 'ott-screen-coercion'}`}>
      {active ? (
        <>🖥️ <strong>SCREEN SHARING IS ACTIVE</strong> — Do NOT open banking apps, enter OTPs, or show passwords.</>
      ) : (
        <>⚠️ <strong>CALLER IS DEMANDING SCREEN ACCESS</strong> — Legitimate banks and support agents never need your screen.</>
      )}
    </div>
  );
}

export default function OTTDashboard() {
  const [channel, setChannel] = useState('WHATSAPP');
  const [callOrigin, setCallOrigin] = useState('DIRECT_DIAL');
  const [isSavedContact, setIsSavedContact] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [accountAge, setAccountAge] = useState('');
  const [manualText, setManualText] = useState('');
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [chatLinks, setChatLinks] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [fastPathAlert, setFastPathAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  // OTT Scenario presets for demo
  const SCENARIOS = [
    {
      label: '🏦 Bank Screen-Share Scam',
      text: "I'm calling from SBI Bank's fraud prevention team. Your account shows unauthorized activity. Please share your screen and open your YONO banking app right now. Tell me the OTP you receive.",
      origin: 'DIRECT_DIAL',
      saved: false,
      screen: true,
      age: 3,
      video: false,
      links: [],
    },
    {
      label: '🎥 Video Extortion Blackmail',
      text: "I have a video recording of you from our last video call. If you don't transfer ₹1,00,000 to this UPI ID within the hour, I will share it with all your contacts on WhatsApp and Instagram.",
      origin: 'DIRECT_DIAL',
      saved: false,
      screen: false,
      age: 2,
      video: true,
      links: [],
    },
    {
      label: '📲 AnyDesk Remote Takeover',
      text: "Your phone has been compromised by a virus. Please download AnyDesk app from this link and give me the 9-digit access code so our technician can remove the threat.",
      origin: 'UNSOLICITED_CHAT',
      saved: false,
      screen: false,
      age: 10,
      video: false,
      links: ['http://anydesk-support-fix.xyz/download.apk'],
    },
    {
      label: '👩‍👩‍👦 Legitimate Family Call',
      text: "Hi mom! It's your daughter calling from London. How is everyone doing at home? I just wanted to check in. Is dad's health better now?",
      origin: 'KNOWN_CONTACT',
      saved: true,
      screen: false,
      age: 1460,
      video: true,
      links: [],
    },
    {
      label: '💼 Fake Job Telegram Task',
      text: "Congratulations! You have been selected for our work-from-home program. You can earn ₹5000 per hour by completing simple WhatsApp tasks. Click the link I sent to register and activate your account immediately.",
      origin: 'BROADCAST',
      saved: false,
      screen: false,
      age: 8,
      video: false,
      links: ['http://earn-task-app.top/register?ref=wa123'],
    },
    {
      label: '🔒 International Business Call',
      text: "Good morning. This is Rahul from the procurement team at TechCorp Singapore. I wanted to discuss the Q4 supply agreement we emailed you about last week. Is this a good time?",
      origin: 'DIRECT_DIAL',
      saved: false,
      screen: false,
      age: 730,
      video: false,
      links: [],
    },
  ];

  const applyScenario = (scenario) => {
    setManualText(scenario.text);
    setCallOrigin(scenario.origin);
    setIsSavedContact(scenario.saved);
    setScreenShareActive(scenario.screen);
    setAccountAge(scenario.age !== undefined ? String(scenario.age) : '');
    setIsVideoCall(scenario.video);
    setChatLinks(scenario.links.join('\n'));
  };

  const analyze = useCallback(async () => {
    if (!manualText.trim()) return;
    setLoading(true);
    setFastPathAlert(null);
    try {
      const payload = {
        text: manualText,
        channel,
        screen_share_active: screenShareActive,
        screen_share_coercion_detected: false,
        video_extortion_pattern: isVideoCall && callOrigin === 'DIRECT_DIAL' && !isSavedContact,
        links_in_chat: chatLinks.trim() ? chatLinks.trim().split('\n').filter(Boolean) : [],
        caller_context: {
          is_saved_contact: isSavedContact,
          call_origin: callOrigin,
          is_video_call: isVideoCall,
          account_age_days: accountAge ? parseInt(accountAge, 10) : null,
          chat_messages_before_call: 0,
          has_unsolicited_link_before_call: chatLinks.trim().length > 0,
        },
      };

      const res = await fetch('/api/ott/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setAnalysis(data);
      setLiveTranscript(manualText);

      if (data.fast_path_triggered && data.fast_path_alert) {
        setFastPathAlert({
          title: data.fast_path_alert.label || 'CRITICAL RISK DETECTED',
          bullets: [
            'Stop sharing any sensitive information immediately',
            'Do NOT enter OTPs, PINs, or open banking apps',
            'Legitimate banks never need your screen or remote access',
            'End this call and report the number',
          ],
          emergency_actions: data.fast_path_alert.emergency_actions || [
            { id: 'stop_sharing', label: 'STOP SHARING', severity: 'primary' },
            { id: 'end_call', label: 'END CALL', severity: 'danger' },
            { id: 'block_caller', label: 'BLOCK CALLER', severity: 'danger' },
          ],
        });
      }
    } catch (err) {
      console.error('OTT analysis error:', err);
    } finally {
      setLoading(false);
    }
  }, [manualText, channel, screenShareActive, isSavedContact, callOrigin, isVideoCall, accountAge, chatLinks]);

  const handleAction = (actionId) => {
    setFastPathAlert(null);
    if (actionId === 'end_call') {
      setAnalysis(null);
      setManualText('');
      setLiveTranscript('');
    }
  };

  const cls = analysis?.classification || 'SAFE';
  const colors = RISK_COLORS[cls] || RISK_COLORS.SAFE;

  return (
    <div className="ott-dashboard">
      {/* Fast-path overlay — always on top */}
      {fastPathAlert && <FastPathAlert alert={fastPathAlert} onAction={handleAction} />}

      {/* Header */}
      <div className="ott-header">
        <div className="ott-header-left">
          <div className="ott-logo">
            <span className="ott-logo-icon">🛡️</span>
            <div>
              <div className="ott-logo-title">SILENT WITNESS</div>
              <div className="ott-logo-sub">OTT / VoIP Call Protection</div>
            </div>
          </div>
        </div>
        <div className="ott-channel-tabs">
          {Object.entries(CHANNEL_LABELS).map(([key, meta]) => (
            <button
              key={key}
              className={`ott-channel-tab ${channel === key ? 'ott-channel-active' : ''}`}
              style={channel === key ? { borderBottomColor: meta.color, color: meta.color } : {}}
              onClick={() => setChannel(key)}
            >
              {meta.icon} {meta.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ott-body">
        {/* Left: Configuration + Scenarios */}
        <div className="ott-left-panel">
          <div className="ott-section-card">
            <h3 className="ott-section-title">📋 Caller Context</h3>
            <div className="ott-form-grid">
              <div className="ott-form-group">
                <label className="ott-label">Call Origin</label>
                <select
                  className="ott-select"
                  value={callOrigin}
                  onChange={(e) => setCallOrigin(e.target.value)}
                >
                  {CALL_ORIGINS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="ott-form-group">
                <label className="ott-label">Account Age (days)</label>
                <input
                  type="number"
                  className="ott-input"
                  placeholder="e.g. 730 = 2 years"
                  value={accountAge}
                  onChange={(e) => setAccountAge(e.target.value)}
                />
              </div>
              <div className="ott-toggle-row">
                <label className="ott-toggle-label">
                  <input type="checkbox" checked={isSavedContact} onChange={(e) => setIsSavedContact(e.target.checked)} />
                  <span className="ott-toggle-text">Saved Contact</span>
                </label>
                <label className="ott-toggle-label">
                  <input type="checkbox" checked={isVideoCall} onChange={(e) => setIsVideoCall(e.target.checked)} />
                  <span className="ott-toggle-text">Video Call</span>
                </label>
                <label className="ott-toggle-label">
                  <input
                    type="checkbox"
                    checked={screenShareActive}
                    onChange={(e) => setScreenShareActive(e.target.checked)}
                  />
                  <span className="ott-toggle-text ott-toggle-danger">Screen Sharing ON</span>
                </label>
              </div>
            </div>
          </div>

          <div className="ott-section-card">
            <h3 className="ott-section-title">🔗 Chat Links</h3>
            <textarea
              className="ott-textarea ott-link-area"
              placeholder="Paste any links shared in chat (one per line)..."
              rows={3}
              value={chatLinks}
              onChange={(e) => setChatLinks(e.target.value)}
            />
          </div>

          <div className="ott-section-card">
            <h3 className="ott-section-title">🎭 Demo Scenarios</h3>
            <div className="ott-scenario-list">
              {SCENARIOS.map((sc, i) => (
                <button key={i} className="ott-scenario-btn" onClick={() => applyScenario(sc)}>
                  {sc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Transcript + Analysis */}
        <div className="ott-center-panel">
          <ScreenShareBanner
            active={screenShareActive}
            coercionDetected={analysis?.screen_share_analysis?.is_screen_share_demanded}
          />

          <div className="ott-section-card ott-transcript-card">
            <h3 className="ott-section-title">💬 Call Transcript / Message</h3>
            <textarea
              className="ott-textarea"
              rows={7}
              placeholder="Paste conversation transcript or type what the caller is saying..."
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
            />
            <button
              className="ott-analyze-btn"
              onClick={analyze}
              disabled={loading || !manualText.trim()}
              style={loading ? {} : { '--btn-glow': colors.glow }}
            >
              {loading ? '⏳ Analyzing...' : '🔍 ANALYZE CALL'}
            </button>
          </div>

          {analysis && (
            <div className="ott-results-card" style={{ borderColor: colors.border, boxShadow: `0 0 20px ${colors.glow}` }}>
              {/* Classification header */}
              <div className="ott-classification-header" style={{ background: colors.bg, color: colors.text }}>
                <span className="ott-class-label">{analysis.severity_label || analysis.classification}</span>
                {analysis.fast_path_triggered && (
                  <span className="ott-fastpath-badge">⚡ FAST-PATH OVERRIDE ACTIVE</span>
                )}
              </div>

              <div className="ott-results-body">
                {/* Gauge */}
                <RiskGauge
                  riskScore={analysis.ott_risk_score}
                  trustScore={analysis.ott_trust_score}
                  classification={analysis.classification}
                  severityLabel={analysis.severity_label}
                />

                {/* OTT Signals */}
                <OTTSignalPills signals={analysis.ott_signals} />

                {/* Attribution */}
                <AttributionBar attribution={analysis.attribution} />

                {/* Screen share analysis */}
                {analysis.screen_share_analysis?.is_screen_share_demanded && (
                  <div className="ott-ss-warning">
                    🖥️ <strong>Screen Share Coercion Detected:</strong>{' '}
                    {analysis.screen_share_analysis.recommended_action || 'STOP — Do not share your screen.'}
                  </div>
                )}

                {/* Link analysis */}
                {analysis.link_analysis?.results?.length > 0 && (
                  <div className="ott-links-section">
                    <h4 className="ott-section-title">🔗 Link Risk Analysis</h4>
                    {analysis.link_analysis.results.map((r, i) => (
                      <div key={i} className={`ott-link-result ott-link-${r.risk_level?.toLowerCase()}`}>
                        <div className="ott-link-url">{r.url?.substring(0, 60)}...</div>
                        <div className="ott-link-risk">Risk: {r.risk_score} — {r.risk_level}</div>
                        {r.reasons?.map((rr, j) => (
                          <div key={j} className="ott-link-reason">⚠ {rr}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* NLP evidence from base system */}
                {analysis.nlp_analysis?.evidence?.length > 0 && (
                  <div className="ott-evidence-section">
                    <h4 className="ott-section-title">🔎 Evidence Extracted</h4>
                    {analysis.nlp_analysis.evidence.slice(0, 5).map((e, i) => (
                      <div key={i} className="ott-evidence-item">
                        <span className="ott-evidence-tag">{e.detected_tag}</span>
                        <span className="ott-evidence-phrase">"{e.exact_phrase}"</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Identity + Guidance */}
        <div className="ott-right-panel">
          {analysis?.identity_analysis && (
            <div className="ott-section-card">
              <h3 className="ott-section-title">👤 Caller Identity</h3>
              <IdentityBadge identity={analysis.identity_analysis} />
            </div>
          )}

          <div className="ott-section-card ott-guidance-card">
            <h3 className="ott-section-title">🛡️ Protection Status</h3>
            <div className="ott-capability-list">
              <div className="ott-cap-item ott-cap-active">
                <span className="ott-cap-dot" />
                <span>Screen-share monitoring</span>
              </div>
              <div className="ott-cap-item ott-cap-active">
                <span className="ott-cap-dot" />
                <span>OTT identity analysis</span>
              </div>
              <div className="ott-cap-item ott-cap-active">
                <span className="ott-cap-dot" />
                <span>Link & file scanner</span>
              </div>
              <div className="ott-cap-item ott-cap-active">
                <span className="ott-cap-dot" />
                <span>Video extortion detection</span>
              </div>
              <div className="ott-cap-item ott-cap-limited">
                <span className="ott-cap-dot ott-cap-dot-limited" />
                <span>Voice authenticity (OTT limited)</span>
              </div>
              <div className="ott-cap-item ott-cap-restricted">
                <span className="ott-cap-dot ott-cap-dot-restricted" />
                <span>Raw audio intercept (platform restricted)</span>
              </div>
            </div>
            <div className="ott-honesty-note">
              <strong>Technical Honesty:</strong> WhatsApp/Telegram audio is end-to-end encrypted. Silent Witness
              cannot intercept raw audio from third-party apps. Protection works via OS accessibility
              events, notification screening, and call analysis you provide.
            </div>
          </div>

          <div className="ott-section-card">
            <h3 className="ott-section-title">📖 Golden Rules</h3>
            <div className="ott-rules">
              <div className="ott-rule">🚫 No bank ever calls via WhatsApp for OTP verification</div>
              <div className="ott-rule">🚫 Never share your screen with an incoming caller</div>
              <div className="ott-rule">🚫 Never install apps from links sent during a call</div>
              <div className="ott-rule">🚫 Never give AnyDesk/remote access to anyone you don't know</div>
              <div className="ott-rule ott-rule-green">✓ Hang up and call back on the official number</div>
              <div className="ott-rule ott-rule-green">✓ Report WhatsApp scam numbers at wa.me/0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
