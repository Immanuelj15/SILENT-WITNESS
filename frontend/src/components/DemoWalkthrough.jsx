import React, { useState } from 'react';
import {
  Play, RotateCcw, ArrowRight, ShieldAlert, Sparkles, Check, PhoneCall,
  HeartHandshake, CheckCircle, Video, Monitor, Cpu
} from 'lucide-react';

const SCENARIOS = [
  {
    id: "bank_screen_share",
    name: "Demo 1: Bank Impersonation & Screen Share (Sec. 49 & 52)",
    icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
    channel: "WHATSAPP",
    description: "Claims bank identity, creates account-blocking panic, solicits OTP, and demands screen sharing.",
    steps: [
      {
        stepNumber: 1,
        title: "Step 1: Normal Greeting",
        speech: "Hello, good afternoon sir. Am I speaking with the primary account holder?",
        expectedTrust: 94,
        status: "SAFE",
        badgeClass: "badge-safe",
        explanation: "Polite opening. No coercive indicators, demands, or urgency detected."
      },
      {
        stepNumber: 2,
        title: "Step 2: Unverified Identity Claim",
        speech: "I am calling from your SBI security branch regarding an unauthorized debit transaction.",
        expectedTrust: 78,
        status: "GUARDED",
        badgeClass: "badge-warn",
        explanation: "Identity claim detected ('SBI security'). Applied core rule: Claimed Identity ≠ Verified Identity."
      },
      {
        stepNumber: 3,
        title: "Step 3: Account-Blocking Urgency",
        speech: "Your account has an emergency fraud hold and will be permanently blocked within 30 minutes.",
        expectedTrust: 55,
        status: "MEDIUM",
        badgeClass: "badge-warn",
        explanation: "Scam Agent flags artificial deadline urgency ('within 30 minutes') and intimidation ('permanently blocked')."
      },
      {
        stepNumber: 4,
        title: "Step 4: Credential Solicitation",
        speech: "I sent an authorization code to your mobile. Tell me the OTP immediately to cancel the debit.",
        expectedTrust: 27,
        status: "HIGH RISK",
        badgeClass: "badge-danger",
        explanation: "Intent Agent flags direct OTP solicitation under pressure. Deterministic high-severity penalty applied."
      },
      {
        stepNumber: 5,
        title: "Step 5: Screen-Sharing Demand",
        speech: "Now open WhatsApp video, tap Share Screen, and open your YONO banking app so I can verify the cancellation.",
        expectedTrust: 9,
        status: "CRITICAL RISK",
        badgeClass: "badge-danger",
        explanation: "Screen Share Agent triggers emergency override: Coercive demand to expose banking app and screen."
      }
    ]
  },
  {
    id: "family_emergency",
    name: "Demo 2: Family Impersonation Scam (Sec. 50)",
    icon: <PhoneCall className="w-4 h-4 text-orange-400" />,
    channel: "SIM_CALL",
    description: "Impersonates family member in distress at police station, demanding immediate money transfer.",
    steps: [
      {
        stepNumber: 1,
        title: "Step 1: Emotional Distress Hook",
        speech: "Mom, I am in serious trouble right now. Please listen to me carefully.",
        expectedTrust: 80,
        status: "GUARDED",
        badgeClass: "badge-warn",
        explanation: "Emotional distress and urgency signals detected. Caller claiming family identity without authentication."
      },
      {
        stepNumber: 2,
        title: "Step 2: Secrecy & Isolation",
        speech: "I am at the police station. Please do not tell dad or call anyone, keep this completely confidential.",
        expectedTrust: 55,
        status: "MEDIUM",
        badgeClass: "badge-warn",
        explanation: "Isolation tactic detected: Scammer actively commands victim not to notify family or third parties."
      },
      {
        stepNumber: 3,
        title: "Step 3: Immediate Fund Transfer Demand",
        speech: "They will arrest me unless you send 50,000 rupees immediately to this UPI number right now.",
        expectedTrust: 18,
        status: "CRITICAL RISK",
        badgeClass: "badge-danger",
        explanation: "Extortion threat combined with urgent third-party UPI payment. Identity unverified."
      }
    ]
  },
  {
    id: "video_extortion",
    name: "Demo 3: Video Call Extortion (Sec. 51)",
    icon: <Video className="w-4 h-4 text-purple-400" />,
    channel: "VIDEO_CALL",
    description: "Unknown video caller attempts camera manipulation, threatening recording and blackmail.",
    steps: [
      {
        stepNumber: 1,
        title: "Step 1: Unknown Caller Video Request",
        speech: "Turn on your front camera so I can see you clearly. Why is your video off?",
        expectedTrust: 74,
        status: "GUARDED",
        badgeClass: "badge-warn",
        explanation: "Unknown video caller demanding camera activation. Unsolicited inbound video stream."
      },
      {
        stepNumber: 2,
        title: "Step 2: Compromising Request & Inappropriate Lure",
        speech: "Come closer to the camera. We are doing a private live session, show yourself.",
        expectedTrust: 42,
        status: "MEDIUM RISK",
        badgeClass: "badge-warn",
        explanation: "Video Agent detects manipulation pattern: Coercing visual camera exposure without verified context."
      },
      {
        stepNumber: 3,
        title: "Step 3: Recording Threat & Blackmail",
        speech: "I have recorded your face and screen. If you don't pay 1 lakh to my crypto wallet, I will send this video to all your contacts.",
        expectedTrust: 10,
        status: "CRITICAL — EXTORTION",
        badgeClass: "badge-danger",
        explanation: "Video Extortion pattern detected: Recording threat + blackmail demand. Protocol: DO NOT PAY, cover camera."
      }
    ]
  },
  {
    id: "remote_access_apk",
    name: "Demo 4: Remote Access AnyDesk / APK Scam (Sec. 23)",
    icon: <Monitor className="w-4 h-4 text-rose-400" />,
    channel: "WHATSAPP",
    description: "Claims technical support, coerces victim into downloading AnyDesk/remote APK to take over device.",
    steps: [
      {
        stepNumber: 1,
        title: "Step 1: Telecom Customer Support Pretence",
        speech: "Good morning, this is Airtel customer support. Your 5G SIM card update has failed.",
        expectedTrust: 76,
        status: "GUARDED",
        badgeClass: "badge-warn",
        explanation: "Corporate customer service impersonation without verified carrier credential."
      },
      {
        stepNumber: 2,
        title: "Step 2: Technical Malfunction Panic",
        speech: "Your SIM will be deactivated in 10 minutes unless you complete manual remote diagnosis.",
        expectedTrust: 48,
        status: "MEDIUM RISK",
        badgeClass: "badge-warn",
        explanation: "Time-limited deactivation threat forcing immediate action."
      },
      {
        stepNumber: 3,
        title: "Step 3: AnyDesk / TeamViewer / APK Download",
        speech: "Open Play Store, install AnyDesk and QuickSupport, and read me the 9-digit remote access address.",
        expectedTrust: 14,
        status: "CRITICAL — REMOTE TAKEOVER",
        badgeClass: "badge-danger",
        explanation: "Screen-share engine detects remote access tool takeover demand (AnyDesk/QuickSupport). Device compromise risk."
      }
    ]
  },
  {
    id: "ai_voice_ceo",
    name: "Demo 5: AI Voice CEO Impersonation (Sec. 53)",
    icon: <Cpu className="w-4 h-4 text-amber-400" />,
    channel: "OWN_VOIP",
    description: "Cloned executive voice with acoustic artifacts ordering urgent wire transfer for secret acquisition.",
    steps: [
      {
        stepNumber: 1,
        title: "Step 1: Executive Authority Greeting",
        speech: "Hey, this is the Chief Executive Officer speaking directly from the airport terminal.",
        expectedTrust: 72,
        status: "GUARDED",
        badgeClass: "badge-warn",
        explanation: "Executive authority claim. High-level corporate persona invoked."
      },
      {
        stepNumber: 2,
        title: "Step 2: Synthetic Voice Artifacts & Secrecy",
        speech: "I am in confidential board negotiations. Do not email or discuss this with finance.",
        expectedTrust: 46,
        status: "MEDIUM RISK",
        badgeClass: "badge-warn",
        explanation: "Voice Authenticity Agent detects acoustic spectral inconsistency & temporal artifacts. Isolation tactic."
      },
      {
        stepNumber: 3,
        title: "Step 3: Urgent Vendor Wire Transfer",
        speech: "I need you to wire $250,000 immediately to our foreign legal counsel account before close of business.",
        expectedTrust: 19,
        status: "HIGH RISK — VOICE FRAUD",
        badgeClass: "badge-danger",
        explanation: "Voice deepfake signal + executive impersonation + urgent wire transfer. Verify via secondary known channel."
      }
    ]
  },
  {
    id: "legitimate_hospital",
    name: "Demo 6: Legitimate Hospital Call (Sec. 54)",
    icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    channel: "SIM_CALL",
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
    <div className="glass-panel p-5 rounded-2xl shadow-xl border border-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              6 Universal Security Scenarios (Sections 49–54)
            </span>
            <span className="text-[11px] text-slate-400">
              Interactive multi-turn attack sequence & deterministic trust evolution
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleReset} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={handleNext}
            className="btn-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
            disabled={activeStep === steps.length - 1}
          >
            Next Turn <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scenario Selector Tabs - 6 Scenarios */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {SCENARIOS.map((sc, idx) => {
          const isSelected = idx === selectedScenarioIdx;
          return (
            <button
              key={sc.id}
              onClick={() => handleScenarioChange(idx)}
              className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/40 shadow-md'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                {sc.icon}
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  {sc.channel}
                </span>
              </div>
              <span className="font-semibold text-[11px] line-clamp-2">{sc.name.split(':')[1]?.trim() || sc.name}</span>
            </button>
          );
        })}
      </div>

      {/* Scenario Description Banner */}
      <div className="mb-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between">
        <span><strong>Attack Profile:</strong> {scenario.description}</span>
        <span className="font-mono text-[10px] text-cyan-400 font-semibold uppercase">{scenario.channel} Channel</span>
      </div>

      {/* Stepper Timeline */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mb-4">
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
                  ? 'bg-indigo-950/50 border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg'
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
