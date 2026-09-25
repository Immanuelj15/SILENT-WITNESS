import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import TrustScoreRing from './components/TrustScoreRing';
import LiveWaveform from './components/LiveWaveform';
import LiveTranscript from './components/LiveTranscript';
import EvidenceGroundingCard from './components/EvidenceGroundingCard';
import ActionCard from './components/ActionCard';
import DemoWalkthrough from './components/DemoWalkthrough';
import AudioAnalyzer from './components/AudioAnalyzer';
import HistoryDashboard from './components/HistoryDashboard';
import MobileCallModal from './components/MobileCallModal';
import FeatureAttributionDrawer from './components/FeatureAttributionDrawer';
import UserFeedbackModal from './components/UserFeedbackModal';
import AttackTimeline from './components/AttackTimeline';
import IntentChain from './components/IntentChain';
import IdentityVerificationPanel from './components/IdentityVerificationPanel';
import PrivacyCenter from './components/PrivacyCenter';
import ScamKnowledgeBase from './components/ScamKnowledgeBase';
import EvaluationDashboard from './components/EvaluationDashboard';
import PostCallSafetyReportModal from './components/PostCallSafetyReportModal';
import CoachingPromptCard from './components/CoachingPromptCard';
import EmotionalManipulationMeter from './components/EmotionalManipulationMeter';
import ScriptFingerprintBadge from './components/ScriptFingerprintBadge';
import CallerReputationBadge from './components/CallerReputationBadge';
import TamperEvidentAuditModal from './components/TamperEvidentAuditModal';
import ChannelSelector from './components/ChannelSelector';
import ScreenShareAlertModal from './components/ScreenShareAlertModal';
import PlatformCapabilityMatrixModal from './components/PlatformCapabilityMatrixModal';
import VideoAnalysisVisualizer from './components/VideoAnalysisVisualizer';
import {
  Mic, MicOff, Send, Radio, Sparkles, AlertCircle, RefreshCw, MessageSquarePlus,
  FileText, ShieldAlert, CheckCircle, Clock, GitCommit, UserCheck, Activity, Search,
  PhoneOff, ShieldCheck
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('live');
  const [selectedChannel, setSelectedChannel] = useState('SIM_CALL');
  const [easyMode, setEasyMode] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCapabilitiesModalOpen, setIsCapabilitiesModalOpen] = useState(false);
  const [isScreenShareAlertOpen, setIsScreenShareAlertOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isPrivacyCenterOpen, setIsPrivacyCenterOpen] = useState(false);
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(false);
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeReportData, setActiveReportData] = useState(null);

  // Tab for deep intelligence console
  const [forensicTab, setForensicTab] = useState('timeline');

  // Live Call Streaming State
  const [isRecording, setIsRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [manualInputText, setManualInputText] = useState('');
  const [isProvisional, setIsProvisional] = useState(true);

  // Current Analysis Data
  const [currentAnalysis, setCurrentAnalysis] = useState({
    trustScore: 100,
    riskScore: 0,
    confidence: 0.88,
    classification: 'SAFE',
    category: 'Legitimate Conversation',
    recommendation: 'CONVERSATION APPEARS SAFE',
    actions: ['Continue normally', 'Do not share credentials if requested'],
    easyModeSummary: 'Everything seems normal with this conversation.',
    aiExplanation: 'No coercion, urgency, or credential harvesting signals detected.',
    evidence: [],
    suspiciousPhrases: [],
    riskFactors: [],
    voiceAnalysis: {
      voiceRisk: 12.0,
      confidence: 0.85,
      indicators: ['Natural pitch variation and human acoustic balance'],
      is_synthetic_suspected: false
    },
    callerReputation: {
      phone_number: "+91 98765 43210",
      risk_tier: "UNKNOWN_NUMBER",
      label: "Unknown Inbound Caller",
      reputation_score: 60,
      prior_risk_penalty: 10,
      baseline_trust_score: 80,
      is_spoof_risk: false,
      telecom_carrier: "Standard Cellular",
      threat_flags: []
    }
  });

  // Streaming refs
  const wsRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const timerRef = useRef(null);

  // Duration timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // Emergency trigger for screen share coercion modal
  useEffect(() => {
    if (currentAnalysis?.screenShareAnalysis?.is_screen_share_demanded) {
      setIsScreenShareAlertOpen(true);
    }
  }, [currentAnalysis?.screenShareAnalysis?.is_screen_share_demanded]);

  // Connect WebSocket for live call monitoring
  const connectWebSocket = () => {
    try {
      const wsUrl = 'ws://localhost:8000/ws/live-call';
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("Silent Witness Live WebSocket connected.");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'LIVE_UPDATE' && msg.analysis) {
            setCurrentAnalysis(msg.analysis);
            if (msg.analysis.transcript) {
              setLiveTranscript(msg.analysis.transcript);
            }
            setIsProvisional(msg.isProvisional ?? true);
          } else if (msg.event === 'risk_update' && msg.data) {
            setCurrentAnalysis(prev => ({
              ...prev,
              riskScore: msg.data.riskScore,
              trustScore: msg.data.trustScore,
              classification: msg.data.status,
              confidence: msg.data.confidence,
              evidenceConfidence: msg.data.evidenceConfidence
            }));
          }
        } catch (e) {
          console.error("Error decoding live update:", e);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed.");
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to connect live WebSocket:", err);
    }
  };

  // Start live microphone capture
  const handleStartLiveCall = async () => {
    try {
      setLiveTranscript('');
      setCallDuration(0);
      setIsRecording(true);
      connectWebSocket();

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-US';

          recognition.onresult = (event) => {
            let finalSnippet = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalSnippet += event.results[i][0].transcript;
              }
            }
            if (finalSnippet && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ text: finalSnippet, isFinal: true }));
            }
          };

          recognition.start();
        }
      }
    } catch (err) {
      console.warn("Microphone capture unavailable or denied:", err);
      setIsRecording(true);
      connectWebSocket();
    }
  };

  // Stop live monitoring
  const handleStopLiveCall = () => {
    setIsRecording(false);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ isFinal: true, text: "" }));
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // Send manual speech phrase to backend
  const handleSendManualSpeech = async (overrideText = null, overrideChannel = null) => {
    const textToSend = overrideText || manualInputText;
    if (!textToSend.trim()) return;

    const channelToSend = overrideChannel || selectedChannel;

    try {
      const res = await fetch('http://localhost:8000/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend, channel: channelToSend })
      });
      const data = await res.json();
      setCurrentAnalysis(data);
      setLiveTranscript(textToSend);
      setIsProvisional(false);
      if (!overrideText) {
        setManualInputText('');
      }
    } catch (e) {
      console.error("Failed to analyze manual input text:", e);
    }
  };

  // Open Post-Call Safety Report Modal
  const handleOpenReport = async () => {
    if (currentAnalysis.id) {
      try {
        const res = await fetch(`http://localhost:8000/api/analysis/${currentAnalysis.id}/report`);
        if (res.ok) {
          const report = await res.json();
          setActiveReportData(report);
          setIsReportModalOpen(true);
          return;
        }
      } catch (e) {
        console.error("Could not fetch pre-generated report:", e);
      }
    }

    setActiveReportData({
      report_id: `REPORT-${Date.now().toString().slice(-6)}`,
      generated_at: new Date().toISOString(),
      call_overview: {
        classification: currentAnalysis.classification,
        trust_score: currentAnalysis.trustScore,
        risk_score: currentAnalysis.riskScore,
        category: currentAnalysis.category,
        duration_seconds: callDuration || 45.0
      },
      forensic_findings: {
        scam_tactics_detected: currentAnalysis.riskFactors || [],
        credential_demands: currentAnalysis.suspiciousPhrases || [],
        verbatim_evidence_citations: currentAnalysis.evidence?.map(e => e.exact_phrase) || [],
        contradictions_identified: currentAnalysis.identityAudit?.contradictions || []
      },
      risk_assessment: {
        threat_level: currentAnalysis.classification,
        summary: currentAnalysis.aiExplanation,
        recommended_immediate_actions: currentAnalysis.actions || []
      },
      sanitized_summary_mode: {
        summaryText: `Call evaluated as ${currentAnalysis.classification} (Trust: ${currentAnalysis.trustScore}/100, Risk: ${currentAnalysis.riskScore}/100). Category: ${currentAnalysis.category}. Primary recommendation: ${currentAnalysis.actions?.[0] || 'Stay cautious'}.`
      }
    });
    setIsReportModalOpen(true);
  };

  // Quick 1-click test scenarios
  const quickTestScenarios = [
    {
      title: "Bank KYC OTP Demand",
      icon: "🏦",
      phrase: "Hello sir, calling from your bank SBI. Your account will be blocked within 1 hour. Share the 6-digit OTP immediately to avoid permanent deactivation."
    },
    {
      title: "Digital Arrest / Police",
      icon: "🚨",
      phrase: "This is Mumbai Police Customs Department. A parcel in your name was seized containing illegal narcotics. You are under immediate digital arrest and Skype surveillance."
    },
    {
      title: "Electricity Power Cut",
      icon: "⚡",
      phrase: "Dear consumer, your electricity will be disconnected tonight at 9:30 PM due to unpaid previous bill. Call our officer immediately to pay Rs 10 update fee."
    },
    {
      title: "Hospital Emergency (Safe)",
      icon: "🏥",
      phrase: "Hello Mr. Kumar, this is Apollo Hospital reception confirming your routine health checkup tomorrow at 10 AM. Please bring your medical file."
    }
  ];

  const isHighRisk = currentAnalysis.riskScore >= 65;
  const isMediumRisk = currentAnalysis.riskScore >= 35 && currentAnalysis.riskScore < 65;

  return (
    <div className={easyMode ? 'easy-mode' : ''} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        easyMode={easyMode}
        setEasyMode={setEasyMode}
        language={language}
        setLanguage={setLanguage}
        onOpenMobileView={() => setIsMobileModalOpen(true)}
        onOpenPrivacyCenter={() => setIsPrivacyCenterOpen(true)}
        onOpenKnowledgeBase={() => setIsKnowledgeBaseOpen(true)}
        onOpenEvaluation={() => setIsEvaluationOpen(true)}
        onOpenReport={handleOpenReport}
        onOpenAudit={() => setIsAuditModalOpen(true)}
        onOpenCapabilities={() => setIsCapabilitiesModalOpen(true)}
      />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 24px', flex: 1, width: '100%' }}>
        {/* TAB 1: LIVE CALL MONITOR */}
        {activeTab === 'live' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Universal Communication Channel Selector & Platform Honesty Status */}
            <ChannelSelector
              selectedChannel={selectedChannel}
              onSelectChannel={(ch) => {
                setSelectedChannel(ch);
                setCurrentAnalysis(prev => ({ ...prev, channel: ch }));
              }}
              capabilities={currentAnalysis.capabilities}
            />

            {/* Top Operational Status Banner */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={isRecording ? 'radar-dot' : 'w-3 h-3 rounded-full bg-emerald-500'} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">
                      {isRecording ? 'Live Call Shield Active' : 'Real-Time Voice Shield Standby'}
                    </span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${isRecording ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'}`}>
                      {isRecording ? `MONITORING (${callDuration}s)` : 'ARMED & READY'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Continuous acoustic voice verification & live conversational fraud intelligence
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                {!isRecording ? (
                  <button
                    onClick={handleStartLiveCall}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 cursor-pointer border border-emerald-400/30"
                  >
                    <Mic className="w-4 h-4" /> START MONITORING
                  </button>
                ) : (
                  <button
                    onClick={handleStopLiveCall}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-900/30 transition-all flex items-center gap-2 cursor-pointer border border-red-400/30 animate-pulse"
                  >
                    <MicOff className="w-4 h-4" /> STOP MONITORING
                  </button>
                )}

                <button
                  onClick={handleOpenReport}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  title="Generate structured safety report"
                >
                  <FileText className="w-4 h-4 text-cyan-400" /> Safety Report
                </button>

                <button
                  onClick={() => setIsFeedbackModalOpen(true)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  title="Submit feedback or report false alarm"
                >
                  <MessageSquarePlus className="w-4 h-4 text-indigo-400" /> Calibrate
                </button>
              </div>
            </div>

            {/* Critical Alert Banner if High Risk */}
            {isHighRisk && (
              <div className="bg-red-950/40 border border-red-500/50 rounded-2xl p-4 shadow-xl backdrop-blur-md flex items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-200 uppercase tracking-wide">
                      HIGH RISK COERCION DETECTED — DO NOT SHARE SENSITIVE DATA
                    </h3>
                    <p className="text-xs text-red-300/90 mt-0.5">
                      The caller is attempting credential harvesting or intimidation tactics. Hang up immediately.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStopLiveCall}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-red-900/40 shrink-0 cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" /> DISCONNECT CALL
                </button>
              </div>
            )}

            {/* Video Call & Visual Deepfake Shield (for Video Calls or when Visual Analysis Present) */}
            {(selectedChannel === 'VIDEO_CALL' || currentAnalysis.videoAnalysisResult) && (
              <VideoAnalysisVisualizer
                videoResult={currentAnalysis.videoAnalysisResult || {
                  visual_risk: selectedChannel === 'VIDEO_CALL' ? 15.0 : 0.0,
                  confidence: 0.85,
                  signals: [],
                  is_extortion: false
                }}
              />
            )}

            {/* Caller Reputation & Script Fingerprint Chips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentAnalysis.callerReputation && (
                <CallerReputationBadge callerReputation={currentAnalysis.callerReputation} />
              )}
              {currentAnalysis.scriptFingerprint && currentAnalysis.scriptFingerprint.matched ? (
                <ScriptFingerprintBadge scriptFingerprint={currentAnalysis.scriptFingerprint} />
              ) : (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3 text-xs backdrop-blur-sm">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">Script Fingerprint Scanner</span>
                    <p className="text-[11px] text-slate-400">No canonical scam script signature matched yet.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Core Split Grid: Left = Trust & Defensive Coaching, Right = Waveform & Live Dialogue */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column (5 Cols): Trust Score, Coaching Prompt, Action Card */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                <TrustScoreRing
                  trustScore={currentAnalysis.trustScore}
                  riskScore={currentAnalysis.riskScore}
                  confidence={currentAnalysis.confidence}
                  isProvisional={isProvisional}
                  easyMode={easyMode}
                />

                {/* Real-Time Verbal Coaching Card */}
                {currentAnalysis.coaching && (
                  <CoachingPromptCard coaching={currentAnalysis.coaching} />
                )}

                <ActionCard
                  recommendation={currentAnalysis.recommendation}
                  actions={currentAnalysis.actions}
                  easyModeSummary={currentAnalysis.easyModeSummary}
                  riskScore={currentAnalysis.riskScore}
                  onEndCall={isRecording ? handleStopLiveCall : null}
                  easyMode={easyMode}
                />

                <FeatureAttributionDrawer
                  attributions={currentAnalysis.attributions}
                  severityTier={currentAnalysis.severityTier}
                  easyMode={easyMode}
                />
              </div>

              {/* Right Column (7 Cols): Audio Waveform, Live Transcript, Speech Simulator */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                <LiveWaveform
                  isRecording={isRecording}
                  voiceAnalysis={currentAnalysis.voiceAnalysis}
                  duration={callDuration}
                />

                <LiveTranscript
                  transcript={liveTranscript || currentAnalysis.transcript}
                  dialogueTurns={currentAnalysis.dialogueTurns}
                  evidence={currentAnalysis.evidence}
                  suspiciousPhrases={currentAnalysis.suspiciousPhrases}
                  isProvisional={isProvisional}
                  easyMode={easyMode}
                />

                {/* Speech Input & 1-Click Quick Attack Scenario Simulator */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Live Speech Simulator
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Type phrase or tap 1-click test lures below
                    </span>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendManualSpeech();
                    }}
                    className="flex gap-2 mb-3"
                  >
                    <input
                      type="text"
                      value={manualInputText}
                      onChange={(e) => setManualInputText(e.target.value)}
                      placeholder='Type speech e.g., "Your account will be blocked. Share the OTP now."'
                      className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-900/20 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" /> Analyze
                    </button>
                  </form>

                  {/* 1-Click Quick Scenario Pills */}
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 self-center mr-1 font-semibold">1-Click Test:</span>
                    {quickTestScenarios.map((sc, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendManualSpeech(sc.phrase)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 text-[11px] text-slate-300 font-medium transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{sc.icon}</span>
                        <span>{sc.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Deep Conversational Intelligence Section Organized in Tabs */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md mt-2">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Deep Forensic Intelligence Console
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Explore multi-turn attack timeline, identity verification, emotional coercion, and grounded citations
                  </p>
                </div>

                {/* Segmented Tab Controls */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setForensicTab('timeline')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      forensicTab === 'timeline'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Timeline ({currentAnalysis.timeline?.length || 0})
                  </button>

                  <button
                    onClick={() => setForensicTab('chain')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      forensicTab === 'chain'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <GitCommit className="w-3.5 h-3.5" />
                    Attack Chain
                  </button>

                  <button
                    onClick={() => setForensicTab('identity')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      forensicTab === 'identity'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Caller Identity
                  </button>

                  <button
                    onClick={() => setForensicTab('emotion')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      forensicTab === 'emotion'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Coercion Meter
                  </button>

                  <button
                    onClick={() => setForensicTab('evidence')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      forensicTab === 'evidence'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    Evidence ({currentAnalysis.evidence?.length || 0})
                  </button>
                </div>
              </div>

              {/* Tab Content Display */}
              <div className="pt-2">
                {forensicTab === 'timeline' && (
                  <AttackTimeline timeline={currentAnalysis.timeline} />
                )}

                {forensicTab === 'chain' && (
                  <IntentChain intentChain={currentAnalysis.intentChain} />
                )}

                {forensicTab === 'identity' && (
                  <IdentityVerificationPanel identityAudit={currentAnalysis.identityAudit} />
                )}

                {forensicTab === 'emotion' && (
                  <EmotionalManipulationMeter emotionData={currentAnalysis.emotionAnalysis} />
                )}

                {forensicTab === 'evidence' && (
                  <EvidenceGroundingCard
                    evidence={currentAnalysis.evidence}
                    category={currentAnalysis.category}
                    aiExplanation={currentAnalysis.aiExplanation}
                    easyMode={easyMode}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: UPLOAD RECORDED AUDIO */}
        {activeTab === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <AudioAnalyzer
              onAnalysisComplete={(data) => {
                setCurrentAnalysis(data);
                setLiveTranscript(data.transcript);
              }}
            />

            {/* Display Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <TrustScoreRing
                trustScore={currentAnalysis.trustScore}
                riskScore={currentAnalysis.riskScore}
                confidence={currentAnalysis.confidence}
                isProvisional={false}
                easyMode={easyMode}
              />
              <ActionCard
                recommendation={currentAnalysis.recommendation}
                actions={currentAnalysis.actions}
                easyModeSummary={currentAnalysis.easyModeSummary}
                riskScore={currentAnalysis.riskScore}
                easyMode={easyMode}
              />
            </div>

            <EvidenceGroundingCard
              evidence={currentAnalysis.evidence}
              category={currentAnalysis.category}
              aiExplanation={currentAnalysis.aiExplanation}
              easyMode={easyMode}
            />
          </div>
        )}

        {/* TAB 3: GUIDED SCAM DEMONSTRATIONS */}
        {activeTab === 'demo' && (
          <DemoWalkthrough
            onSimulateStep={(accumulatedTranscript, stepConfig) => {
              setLiveTranscript(accumulatedTranscript);
              const targetChannel = stepConfig?.channel || selectedChannel;
              if (targetChannel !== selectedChannel) {
                setSelectedChannel(targetChannel);
              }
              handleSendManualSpeech(accumulatedTranscript, targetChannel);
            }}
          />
        )}

        {/* TAB 4: CALL HISTORY */}
        {activeTab === 'history' && (
          <HistoryDashboard
            onSelectSession={async (id) => {
              try {
                const res = await fetch(`http://localhost:8000/api/analysis/${id}`);
                const data = await res.json();
                setCurrentAnalysis(data);
                setLiveTranscript(data.transcript);
                setActiveTab('live');
              } catch (e) {
                console.error(e);
              }
            }}
          />
        )}
      </main>

      {/* Section 23 Mobile View Call Simulation Modal */}
      <MobileCallModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        analysis={currentAnalysis}
        onEndCall={handleStopLiveCall}
      />

      {/* Screen Sharing Scam Intervention Alert Modal */}
      <ScreenShareAlertModal
        isOpen={isScreenShareAlertOpen}
        onClose={() => setIsScreenShareAlertOpen(false)}
        screenData={currentAnalysis.screenShareAnalysis}
        onEndCall={handleStopLiveCall}
      />

      {/* Platform Capability & Technical Honesty Matrix Modal */}
      <PlatformCapabilityMatrixModal
        isOpen={isCapabilitiesModalOpen}
        onClose={() => setIsCapabilitiesModalOpen(false)}
      />

      {/* User Feedback Loop Modal */}
      <UserFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        callId={currentAnalysis.id}
      />

      {/* Privacy Center Modal */}
      <PrivacyCenter
        isOpen={isPrivacyCenterOpen}
        onClose={() => setIsPrivacyCenterOpen(false)}
      />

      {/* Scam Knowledge Base Modal */}
      <ScamKnowledgeBase
        isOpen={isKnowledgeBaseOpen}
        onClose={() => setIsKnowledgeBaseOpen(false)}
      />

      {/* Evaluation Dashboard Modal */}
      <EvaluationDashboard
        isOpen={isEvaluationOpen}
        onClose={() => setIsEvaluationOpen(false)}
      />

      {/* Post-Call Safety Report Modal */}
      <PostCallSafetyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportData={activeReportData}
      />

      {/* Tamper-Evident Cryptographic Audit Ledger Modal */}
      <TamperEvidentAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        sessionId={currentAnalysis.id}
      />
    </div>
  );
}
