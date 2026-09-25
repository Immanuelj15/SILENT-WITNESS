import React, { useState } from 'react';
import { Play, RotateCcw, ArrowRight, ShieldAlert, Sparkles, Check, PhoneCall, HeartHandshake, CheckCircle } from 'lucide-react';

const SCENARIOS = [
  {
    id: "bank_otp",
    name: "Demo 1: Bank OTP Scam (Section 87)",
    icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
    description: "Impersonates bank security, creates account suspension panic, and solicts SMS OTP.",
    steps: [
      {
        stepNumber: 1,
        title: "Step 1: Normal Greeting",
        speech: "Hello, good afternoon sir. Am I speaking with the primary account holder?",
        expectedTrust: 95,
        status: "SAFE",
        badgeClass: "badge-safe",
        explanation: "Natural polite telephone greeting. No coercive signals, requests, or urgency detected."
      },
      {
        stepNumber: 2,
        title: "Step 2: Unverified Identity Claim",
        speech: "I am calling from your bank branch security office.",
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
        title: "Step 4: Credential Solicitation",
        speech: "I have dispatched a security authorization SMS. Tell me the OTP immediately to prevent immediate suspension.",
        expectedTrust: 12,
        status: "🚨 STOP AND VERIFY — CRITICAL",
        badgeClass: "badge-danger",
        explanation: "Intent Agent flags direct OTP solicitation under severe urgency. Deterministic high-severity override triggered."
      }
    ]
  },
  {
    id: "family_emergency",
    name: "Demo 2: Family Emergency Scam (Section 88)",
    icon: <PhoneCall className="w-4 h-4 text-orange-400" />,
    description: "Impersonates family member in distress at police station, demanding immediate money transfer.",
    steps: [
      {
        stepNumber: 1,
        title: "Step 1: Emotional Distress Hook",
        speech: "Mom, I am in serious trouble right now. Please listen to me carefully.",
        expectedTrust: 80,
        status: "CAUTION",
        badgeClass: "badge-warn",
        explanation: "Emotional distress and urgency signals detected. Caller claiming family identity without authentication."
      },
      {
        stepNumber: 2,
        title: "Step 2: Secrecy & Isolation",
        speech: "I am at the police station. Please do not tell dad or call anyone, keep this completely confidential.",
        expectedTrust: 55,
        status: "SUSPICIOUS",
        badgeClass: "badge-warn",
        explanation: "Isolation tactic detected: Scammer actively commands victim not to notify family or third parties."
      },
      {
        stepNumber: 3,
        title: "Step 3: Immediate Fund Transfer Demand",
        speech: "They will arrest me unless you send 50000 rupees immediately to this UPI number right now.",
        expectedTrust: 18,
        status: "🚨 HIGH RISK — CRITICAL",
        badgeClass: "badge-danger",
        explanation: "Extortion threat combined with urgent third-party UPI payment. Identity unverified."
      }
    ]
  },
  {
    id: "legitimate_hospital",
    name: "Demo 3: Legitimate Hospital Call (Section 89)",
    icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    description: "Benign hospital desk reminder confirming appointment. Demonstrates zero false positives.",
    steps: [
      {
        stepNumber: 1,
        title: "Step 1: Hospital Desk Greeting",
        speech: "Hello, this is the City Hospital appointment desk calling.",
        expectedTrust: 96,
        status: "SAFE",
        badgeClass: "badge-safe",
        explanation: "Routine institutional identification without pressure, secrecy, or coercive threats."
      },
      {
        stepNumber: 2,
        title: "Step 2: Appointment Confirmation",
        speech: "We are calling to confirm your routine health checkup tomorrow at 10 AM with Dr. Mehta.",
        expectedTrust: 95,
        status: "SAFE",
        badgeClass: "badge-safe",
        explanation: "Standard operational appointment coordination. No credentials or financial transfers solicited."
      },
      {
        stepNumber: 3,
        title: "Step 3: Non-Coercive Reminder",
        speech: "Please remember to bring your insurance card when you arrive at the reception desk. Have a good day.",
        expectedTrust: 96,
        status: "SAFE (NO SCAM SIGNALS)",
        badgeClass: "badge-safe",
        explanation: "Proves Silent Witness does not flag every official or sensitive keyword as fraud. Context verifies safety."
      }
    ]
  }
];

export default function DemoWalkthrough({ onSimulateStep = null }) {
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const scenario = SCENARIOS[selectedScenarioIdx];
  const steps = scenario.steps;

  const handleScenarioChange = (idx) => {
    setSelectedScenarioIdx(idx);
    setActiveStep(0);
    if (onSimulateStep) {
      onSimulateStep(SCENARIOS[idx].steps[0].speech, SCENARIOS[idx].steps[0]);
    }
  };

  const handleStepClick = (index) => {
    setActiveStep(index);
    if (onSimulateStep) {
      const accumulated = steps.slice(0, index + 1).map(s => s.speech).join(" ");
      onSimulateStep(accumulated, steps[index]);
    }
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      handleStepClick(activeStep + 1);
    }
  };

  const handleReset = () => {
    handleStepClick(0);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Interactive Safety Scenarios (Sections 87–89)
          </span>
        </div>

        <div className="flex gap-2">
          <button onClick={handleReset} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={handleNext}
            className="btn-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5"
            disabled={activeStep === steps.length - 1}
          >
            Next Turn <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        {SCENARIOS.map((sc, idx) => {
          const isSelected = idx === selectedScenarioIdx;
          return (
            <button
              key={sc.id}
              onClick={() => handleScenarioChange(idx)}
              className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center gap-2 ${
                isSelected
                  ? 'bg-slate-800 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/40'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {sc.icon}
              <span className="font-semibold truncate">{sc.name.split(':')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Stepper Timeline */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-4">
        {steps.map((step, idx) => {
          const isActive = idx === activeStep;
          const isPassed = idx < activeStep;
          const isDanger = step.expectedTrust < 40;
          const isCaution = step.expectedTrust >= 40 && step.expectedTrust < 75;

          return (
            <div
              key={idx}
              onClick={() => handleStepClick(idx)}
              className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                isActive
                  ? 'bg-indigo-950/40 border-cyan-400 ring-2 ring-cyan-400/30'
                  : isPassed
                  ? 'bg-emerald-950/20 border-emerald-800/40'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] text-slate-400 font-semibold mb-0.5">
                {isPassed ? <Check className="w-3.5 h-3.5 text-emerald-400 inline" /> : `STEP ${step.stepNumber}`}
              </div>
              <div className={`text-xl font-bold font-mono ${
                isDanger ? 'text-red-400' : isCaution ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {step.expectedTrust}
              </div>
              <div className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                {step.status.split('—')[0]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Step Focus Details */}
      <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-cyan-300">
            {steps[activeStep].title}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 font-mono font-bold">
            Trust: {steps[activeStep].expectedTrust} / 100
          </span>
        </div>

        <div className="p-3 bg-slate-900/60 rounded-lg italic text-slate-100 mb-2 border-l-2 border-cyan-400 font-serif">
          "{steps[activeStep].speech}"
        </div>

        <div className="text-slate-400 leading-relaxed text-[11px]">
          <strong className="text-slate-300">Deterministic Safety Engine Reasoning: </strong>
          {steps[activeStep].explanation}
        </div>
      </div>
    </div>
  );
}
