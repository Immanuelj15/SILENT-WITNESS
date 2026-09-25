import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Smartphone,
  Video,
  Monitor,
  Cpu,
  UserCheck
} from 'lucide-react';

const SCENARIOS = [
  {
    id: "bank_screen_share",
    name: "Bank Impersonation & Screen Share",
    risk: "CRITICAL",
    channel: "WhatsApp / Online",
    pattern: "Identity Claim → Urgency → OTP Request → Screen Share Coercion",
    description: "Caller poses as bank fraud officer, creates account panic, demands OTP, and talks the victim into sharing screen.",
    steps: [
      { step: 1, text: "Hello, good afternoon sir. Am I speaking with the primary account holder?", score: 94, why: "Polite opening. No urgency or coercive indicators." },
      { step: 2, text: "I am calling from your SBI security branch regarding an unauthorized debit transaction of ₹49,999.", score: 78, why: "Identity claim detected ('SBI security'). Applied core rule: Claimed Identity ≠ Verified Identity." },
      { step: 3, text: "Your account has an emergency fraud hold and will be permanently blocked within 30 minutes if unverified.", score: 55, why: "Urgency and pressure detected ('within 30 minutes', 'permanently blocked')." },
      { step: 4, text: "I sent an authorization code to your mobile. Tell me the OTP immediately to cancel the debit.", score: 27, why: "Direct credential request detected. High-severity penalty for spoken OTP demand." },
      { step: 5, text: "Now tap Share Screen on WhatsApp and open your banking app so I can verify the reversal.", score: 9, why: "Fast-path emergency override: Coercive demand to expose active screen with financial app open." },
    ]
  },
  {
    id: "otp_harvesting",
    name: "Express Delivery OTP Request",
    risk: "HIGH",
    channel: "SIM Cellular",
    pattern: "Courier Impersonation → Small Fee → OTP Verification",
    description: "Caller claims parcel delivery is held up by a ₹5 re-delivery fee, asks victim to share the incoming OTP.",
    steps: [
      { step: 1, text: "Hello, this is Blue Dart courier. I have an express parcel for your address.", score: 92, why: "Standard delivery greeting." },
      { step: 2, text: "Your address label is partially smudged. You need to pay ₹5 re-verification fee right now.", score: 70, why: "Unsolicited payment demand for negligible fee (classic lure)." },
      { step: 3, text: "I have triggered a confirmation message. Read out the 6-digit OTP code to clear delivery.", score: 22, why: "Credential harvesting detected. Legitimate delivery never requires bank OTP." },
    ]
  },
  {
    id: "digital_arrest",
    name: "Digital Arrest / Police Threat",
    risk: "CRITICAL",
    channel: "Video Call",
    pattern: "Official Authority → Criminal Allegation → Isolation → Financial Demands",
    description: "Caller impersonates police or customs, displays fake badges, and threatens imminent arrest unless funds are transferred.",
    steps: [
      { step: 1, text: "This is Sub-Inspector Sharma from Crime Branch Cyber Cell Delhi.", score: 75, why: "High-authority police claim from unverified phone line." },
      { step: 2, text: "A parcel containing narcotics and forged passports addressed to you was seized at customs.", score: 45, why: "Extreme legal threat & psychological intimidation." },
      { step: 3, text: "You are under digital arrest. Stay on this video call, do not speak to family or consult lawyers.", score: 20, why: "Isolation tactic and coercive detention coercion detected." },
      { step: 4, text: "Transfer ₹2,00,000 to this designated RBI safe custody account for forensic clearance.", score: 5, why: "Unconditional financial demand under coercion. 100% scam signature." },
    ]
  },
  {
    id: "family_emergency",
    name: "AI Voice Family Emergency",
    risk: "CRITICAL",
    channel: "SIM / VoIP",
    pattern: "Cloned Voice → Distress Emotion → Bail Money Demand",
    description: "Synthetic voice cloned from social media clips claims family member was arrested or injured and needs instant cash.",
    steps: [
      { step: 1, text: "Dad! It's me! Please help me, I'm in big trouble!", score: 65, why: "Extreme distress opening. Neural voice detector flags unnatural spectral flatness." },
      { step: 2, text: "I was in an accident and the police officer here is arresting me unless we pay immediately.", score: 35, why: "Emotional manipulation paired with urgent bail extortion." },
      { step: 3, text: "His phone is dying, please UPI ₹50,000 to this hospital contact number right now!", score: 10, why: "Urgent payment to third-party unverified recipient." },
    ]
  },
  {
    id: "job_scam",
    name: "Telegram Part-Time Job Scam",
    risk: "HIGH",
    channel: "Telegram",
    pattern: "High Return Promise → Small Tasks → Deposit Demand",
    description: "Offers ₹5,000/day for liking YouTube videos, then coerces victim into high-yield cryptocurrency recharge tasks.",
    steps: [
      { step: 1, text: "Hello! We have part-time remote openings earning ₹3,000 to ₹8,000 daily with just a mobile phone.", score: 68, why: "Unsolicited unrealistic income promise." },
      { step: 2, text: "Join our official Telegram group to complete 3 rating tasks and receive your bonus.", score: 50, why: "Funneling victim into encrypted private messaging channel." },
      { step: 3, text: "To unlock VIP task commission of ₹25,000, recharge ₹5,000 into the merchant wallet.", score: 15, why: "Advance-fee fraud structure identified." },
    ]
  },
  {
    id: "investment_scam",
    name: "VIP Crypto / Forex Investment Scam",
    risk: "HIGH",
    channel: "WhatsApp",
    pattern: "Stock Market Insider → Guaranteed Returns → Fake App APK",
    description: "Adds victim to institutional trading group, shares malicious trading APK, and fabricates fake portfolio profits.",
    steps: [
      { step: 1, text: "Welcome to Professor Mehta's Institutional Wealth Group 12.", score: 70, why: "Unsolicited addition to mass broadcast investment group." },
      { step: 2, text: "Download our proprietary institutional institutional-trading.apk to access unlisted IPO allotments.", score: 25, why: "Malicious APK download link detected in chat context." },
      { step: 3, text: "Guaranteed 400% profit in 48 hours with zero market risk.", score: 8, why: "Guaranteed return claim under fraudulent securities scheme." },
    ]
  },
  {
    id: "video_extortion",
    name: "Video Extortion / Sextortion Lure",
    risk: "CRITICAL",
    channel: "WhatsApp Video",
    pattern: "Unknown Video Call → Explicit Content Exposure → Contact Blackmail",
    description: "Unknown caller initiates video call, flashes inappropriate material, records victim reaction, and threatens contacts.",
    steps: [
      { step: 1, text: "Incoming WhatsApp video call from unknown international number (+234...).", score: 60, why: "Unsolicited inbound video call from unfamiliar geography." },
      { step: 2, text: "Caller flashes inappropriate video within 4 seconds of pickup and captures screen recording.", score: 15, why: "Video content risk module flags extortion pattern." },
      { step: 3, text: "I recorded you on video. Send ₹50,000 or I will send this recording to all your WhatsApp contacts.", score: 3, why: "Direct extortion and blackmail demand. Instant block recommended." },
    ]
  }
];

export default function DemoWalkthrough({ onRunLiveScenario }) {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = selectedScenario.steps;
  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
  };

  const handleSelectScenario = (scen) => {
    setSelectedScenario(scen);
    setCurrentStepIndex(0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Sparkles size={18} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Interactive Scam Scenario Library
          </h2>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Simulate realistic multi-turn social engineering attacks and watch Silent Witness evaluate Trust Score decay in real time.
        </p>
      </div>

      {/* Scenario Selection Grid (Section 24) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {SCENARIOS.map((scen) => {
          const isSelected = selectedScenario.id === scen.id;
          const isCrit = scen.risk === 'CRITICAL';
          return (
            <div
              key={scen.id}
              onClick={() => handleSelectScenario(scen)}
              className="sw-card sw-card-interactive"
              style={{
                padding: '18px 20px',
                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={`badge ${isCrit ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                  {scen.risk}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {scen.channel}
                </span>
              </div>

              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {scen.name}
              </h4>

              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, flex: 1 }}>
                {scen.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {scen.steps.length} Progression Steps
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{isSelected ? 'Active Demo' : 'Run Demo'}</span>
                  <ArrowRight size={13} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulator Workspace (Section 25) */}
      <div className="sw-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em' }}>
              CONVERSATION SIMULATOR
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedScenario.name}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Pattern: {selectedScenario.pattern}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleReset} className="btn-secondary" style={{ padding: '8px 14px' }}>
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
            <button
              onClick={handleNext}
              className="btn-primary"
              disabled={currentStepIndex >= steps.length - 1}
              style={{ padding: '8px 16px' }}
            >
              <span>Advance Step ({currentStepIndex + 1}/{steps.length})</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* 2-Column: Left Info vs Right Conversation */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* Left: Step Forensic Analysis */}
          <div
            style={{
              padding: '18px',
              backgroundColor: 'var(--bg-main)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              FORENSIC STEP EVALUATION
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Step {currentStep.step} of {steps.length}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {currentStep.why}
            </div>

            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Assessed Trust Score:</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: currentStep.score < 50 ? 'var(--danger)' : currentStep.score < 80 ? 'var(--warning)' : 'var(--success)' }}>
                {currentStep.score} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 100</span>
              </span>
            </div>
          </div>

          {/* Right: Live Dialogue Speech Bubble */}
          <div
            style={{
              padding: '18px',
              backgroundColor: 'var(--surface)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              borderLeft: `4px solid ${currentStep.score < 50 ? 'var(--danger)' : currentStep.score < 80 ? 'var(--warning)' : 'var(--primary)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PhoneCall size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>
                INBOUND SPOKEN UTTERANCE
              </span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic' }}>
              "{currentStep.text}"
            </div>
          </div>
        </div>

        {/* Bottom: Trust Score Progression Line (Section 25) */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Trust Score Progression Timeline
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
            {steps.map((st, i) => {
              const isActive = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const col = st.score < 50 ? 'var(--danger)' : st.score < 80 ? 'var(--warning)' : 'var(--success)';

              return (
                <React.Fragment key={i}>
                  <div
                    onClick={() => setCurrentStepIndex(i)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: isCurrent ? `2px solid var(--primary)` : '1px solid var(--border)',
                      backgroundColor: isActive ? 'var(--surface)' : 'var(--bg-main)',
                      opacity: isActive ? 1 : 0.45,
                      cursor: 'pointer',
                      minWidth: '100px',
                      textAlign: 'center',
                      boxShadow: isCurrent ? 'var(--shadow-md)' : 'none',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Step {st.step}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: col }}>
                      {st.score}
                    </div>
                  </div>

                  {i < steps.length - 1 && (
                    <ArrowRight size={14} style={{ color: '#CBD5E1', flexShrink: 0 }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
