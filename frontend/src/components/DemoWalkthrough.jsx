import React, { useState } from 'react';
import { Play, RotateCcw, ArrowRight, ShieldAlert, Sparkles, Check } from 'lucide-react';

const DEMO_STEPS = [
  {
    stepNumber: 1,
    title: "Step 1: Normal Introductory Greeting",
    speech: "Hello, good afternoon sir. Am I speaking with the primary account holder?",
    expectedTrust: 95,
    status: "SAFE",
    badgeClass: "badge-safe",
    explanation: "Natural polite telephone greeting. No coercive signals, requests, or urgency detected."
  },
  {
    stepNumber: 2,
    title: "Step 2: Unverified Identity Claim",
    speech: "Hello sir, I am calling from your bank branch security office.",
    expectedTrust: 78,
    status: "STAY ALERT",
    badgeClass: "badge-warn",
    explanation: "Identity claim detected ('your bank'). Principle applied: Claimed Identity ≠ Verified Identity."
  },
  {
    stepNumber: 3,
    title: "Step 3: Psychological Urgency & Threat",
    speech: "Your account has an urgent verification flag and your account will be blocked today within 1 hour.",
    expectedTrust: 52,
    status: "BE CAREFUL / SUSPICIOUS",
    badgeClass: "badge-warn",
    explanation: "Scam Agent flags artificial deadline urgency ('today within 1 hour') and intimidation ('account will be blocked')."
  },
  {
    stepNumber: 4,
    title: "Step 4: High-Severity Credential Solicitation",
    speech: "I have dispatched a security authorization SMS. Tell me the OTP immediately to prevent immediate suspension.",
    expectedTrust: 12,
    status: "🚨 STOP AND VERIFY — LIKELY SCAM",
    badgeClass: "badge-danger",
    explanation: "Intent Agent flags direct OTP solicitation under severe urgency. Deterministic high-severity override triggered."
  }
];

export default function DemoWalkthrough({ onSimulateStep = null, currentStepIndex = 0 }) {
  const [activeStep, setActiveStep] = useState(0);

  const handleStepClick = (index) => {
    setActiveStep(index);
    if (onSimulateStep) {
      // Send accumulated conversation up to this step
      const accumulated = DEMO_STEPS.slice(0, index + 1).map(s => s.speech).join(" ");
      onSimulateStep(accumulated, DEMO_STEPS[index]);
    }
  };

  const handleNext = () => {
    if (activeStep < DEMO_STEPS.length - 1) {
      handleStepClick(activeStep + 1);
    }
  };

  const handleReset = () => {
    handleStepClick(0);
  };

  return (
    <div className="glass-panel" style={{ padding: '22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Section 40 Demo: Bank OTP Scam Walkthrough
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleReset} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <RotateCcw size={14} /> Reset Demo
          </button>
          <button onClick={handleNext} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }} disabled={activeStep === DEMO_STEPS.length - 1}>
            Next Step <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Experience how the Silent Witness multi-agent safety layer and deterministic risk engine dynamically degrade the Trust Score in real time as social engineering tactics emerge.
      </p>

      {/* Stepper Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
        {DEMO_STEPS.map((step, idx) => {
          const isActive = idx === activeStep;
          const isPassed = idx < activeStep;
          return (
            <div
              key={idx}
              onClick={() => handleStepClick(idx)}
              className="glass-card-interactive"
              style={{
                padding: '12px 10px',
                borderRadius: '12px',
                background: isActive ? 'rgba(99, 102, 241, 0.25)' : isPassed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                border: isActive ? '2px solid var(--accent-cyan)' : isPassed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {isPassed ? <Check size={14} color="#10b981" style={{ display: 'inline' }} /> : `STEP ${step.stepNumber}`}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: step.expectedTrust < 40 ? '#ef4444' : step.expectedTrust < 75 ? '#f59e0b' : '#10b981' }}>
                {step.expectedTrust}
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8' }}>
                {step.status.split('—')[0]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Step Focus Details */}
      <div style={{
        padding: '16px',
        borderRadius: '12px',
        background: 'rgba(9, 14, 26, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#38bdf8' }}>
            {DEMO_STEPS[activeStep].title}
          </span>
          <span className={`badge ${DEMO_STEPS[activeStep].badgeClass}`}>
            Trust Score: {DEMO_STEPS[activeStep].expectedTrust}
          </span>
        </div>

        <div style={{
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          fontStyle: 'italic',
          color: '#f8fafc',
          marginBottom: '10px',
          borderLeft: '3px solid var(--accent-cyan)'
        }}>
          "{DEMO_STEPS[activeStep].speech}"
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <strong>Safety Engine Reasoning:</strong> {DEMO_STEPS[activeStep].explanation}
        </div>
      </div>
    </div>
  );
}
