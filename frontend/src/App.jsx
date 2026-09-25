import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardOverview from './components/DashboardOverview';
import TrustScoreBar from './components/TrustScoreBar';
import ActionCard from './components/ActionCard';
import LiveTranscript from './components/LiveTranscript';
import AttackTimeline from './components/AttackTimeline';
import IntentChain from './components/IntentChain';
import IdentityVerificationPanel from './components/IdentityVerificationPanel';
import HistoryDashboard from './components/HistoryDashboard';
import DemoWalkthrough from './components/DemoWalkthrough';
import ScamKnowledgeBase from './components/ScamKnowledgeBase';
import EvaluationDashboard from './components/EvaluationDashboard';
import CapabilitiesPage from './components/CapabilitiesPage';
import AuditLedgerPage from './components/AuditLedgerPage';
import PrivacyCenter from './components/PrivacyCenter';
import OTTDashboard from './components/OTTDashboard';
import EasyModeView from './components/EasyModeView';
import AudioAnalyzer from './components/AudioAnalyzer';
import MobileCallModal from './components/MobileCallModal';
import PostCallSafetyReportModal from './components/PostCallSafetyReportModal';
import UserFeedbackModal from './components/UserFeedbackModal';
import ScreenShareAlertModal from './components/ScreenShareAlertModal';
import VideoAnalysisVisualizer from './components/VideoAnalysisVisualizer';
import CoachingPromptCard from './components/CoachingPromptCard';
import EmotionalManipulationMeter from './components/EmotionalManipulationMeter';
import CallerReputationBadge from './components/CallerReputationBadge';
import ChannelSelector from './components/ChannelSelector';

import {
  Mic, MicOff, Send, Radio, Sparkles, AlertCircle, RefreshCw,
  FileText, ShieldAlert, CheckCircle, Clock, Smartphone,
  PhoneOff, ShieldCheck, Settings as SettingsIcon, MessageSquarePlus
} from 'lucide-react';
import apiClient from './utils/apiClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedChannel, setSelectedChannel] = useState('SIM_CALL');
  const [easyMode, setEasyMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals & Drawers
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeReportData, setActiveReportData] = useState(null);
  const [isScreenShareAlertOpen, setIsScreenShareAlertOpen] = useState(false);

  // Live Call Streaming State
  const [isRecording, setIsRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [manualInputText, setManualInputText] = useState('');
  const [isProvisional, setIsProvisional] = useState(true);

  // Current Analysis Data
  const [currentAnalysis, setCurrentAnalysis] = useState({
    trustScore: 82,
    riskScore: 18,
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
      indicators: ['Natural human pitch variation and acoustic balance'],
      is_synthetic_suspected: false
    },
    callerReputation: {
      phone_number: "+91 98765 43210",
      contact_name: "Unknown Caller",
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

  // Screen share emergency alert
  useEffect(() => {
    if (currentAnalysis?.screenShareAnalysis?.is_screen_share_demanded) {
      setIsScreenShareAlertOpen(true);
    }
  }, [currentAnalysis?.screenShareAnalysis?.is_screen_share_demanded]);

  // Connect WebSocket for live call monitoring
  const connectWebSocket = () => {
    try {
      const wsUrl = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + (window.location.host || 'localhost:8000') + '/ws/live-call';
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("Silent Witness Live WebSocket connected.");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'LIVE_UPDATE' || data.type === 'STREAM_UPDATE') {
            setCurrentAnalysis(prev => ({
              ...prev,
              ...data.payload,
              trustScore: data.payload.trustScore ?? prev.trustScore,
              riskScore: data.payload.riskScore ?? prev.riskScore,
            }));
            if (data.payload.transcript) {
              setLiveTranscript(data.payload.transcript);
            }
            setIsProvisional(Boolean(data.payload.isProvisional));
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (err) => {
        console.warn("WebSocket connection notice:", err);
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed.");
      };

      wsRef.current = ws;
    } catch (e) {
      console.warn("Could not establish live WebSocket:", e);
    }
  };

  // Start live monitoring
  const handleStartLiveCall = async () => {
    try {
      setIsRecording(true);
      setCallDuration(0);
      setLiveTranscript('');
      connectWebSocket();

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorder.ondataavailable = async (e) => {
          if (e.data.size > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Audio = reader.result.split(',')[1];
              wsRef.current.send(JSON.stringify({
                type: 'AUDIO_CHUNK',
                audioBase64: base64Audio,
                channel: selectedChannel,
              }));
            };
            reader.readAsDataURL(e.data);
          }
        };
        mediaRecorder.start(1500); // 1.5s streaming intervals
      }
    } catch (err) {
      console.warn("Microphone access notice (manual input mode active):", err);
    }
  };

  // Stop live monitoring
  const handleStopLiveCall = () => {
    setIsRecording(false);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // Manual speech injection
  const handleSendManualSpeech = async (overrideText = null) => {
    const textToSend = overrideText || manualInputText;
    if (!textToSend.trim()) return;

    try {
      const data = await apiClient.post('/api/analyze-text', {
        text: textToSend,
        channel: selectedChannel,
      });

      setCurrentAnalysis(data);
      setLiveTranscript(textToSend);
      setIsProvisional(false);
      if (!overrideText) {
        setManualInputText('');
      }
    } catch (e) {
      console.warn("Analysis notice:", e);
    }
  };

  // Open Safety Report
  const handleOpenReport = async () => {
    if (currentAnalysis.id) {
      try {
        const report = await apiClient.get(`/api/analysis/${currentAnalysis.id}/report`);
        setActiveReportData(report);
        setIsReportModalOpen(true);
        return;
      } catch {}
    }

    setActiveReportData({
      report_id: `SW-AUDIT-${Date.now().toString().slice(-6)}`,
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
      },
      risk_assessment: {
        threat_level: currentAnalysis.classification,
        summary: currentAnalysis.aiExplanation,
        recommended_immediate_actions: currentAnalysis.actions || []
      },
      sanitized_summary_mode: {
        summaryText: `Call evaluated as ${currentAnalysis.classification} (Trust: ${currentAnalysis.trustScore}/100). Category: ${currentAnalysis.category}.`
      }
    });
    setIsReportModalOpen(true);
  };

  // Quick 1-click test scenarios
  const quickTestScenarios = [
    {
      title: "Bank KYC OTP Demand",
      phrase: "Hello sir, calling from your bank SBI. Your account will be blocked within 1 hour. Share the 6-digit OTP immediately to avoid permanent deactivation."
    },
    {
      title: "Digital Arrest Threat",
      phrase: "This is Mumbai Police Cyber Crime Cell. A parcel in your name was seized containing illegal narcotics. You are under immediate digital arrest."
    },
    {
      title: "Screen Share Demand",
      phrase: "Please open WhatsApp video call, tap the Share Screen button, and log in to your mobile banking app so I can verify the reversal."
    },
    {
      title: "Legitimate Courier Delivery",
      phrase: "Hello, this is Blue Dart courier. I have an express book delivery for your address. Are you available to receive it?"
    }
  ];

  return (
    <div className={`app-layout ${easyMode ? 'easy-mode' : ''}`}>
      {/* 1. Left SaaS Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        easyMode={easyMode}
        setEasyMode={setEasyMode}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* 2. Main Application Container */}
      <div className="app-main">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          easyMode={easyMode}
          setEasyMode={setEasyMode}
          language={language}
          setLanguage={setLanguage}
          isRecording={isRecording}
          onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Content Area */}
        <main className="app-content">
          {/* Easy Mode View Override */}
          {easyMode && activeTab === 'live' ? (
            <EasyModeView
              trustScore={currentAnalysis.trustScore}
              riskScore={currentAnalysis.riskScore}
              onEndCall={isRecording ? handleStopLiveCall : null}
            />
          ) : (
            <>
              {/* TAB: DASHBOARD OVERVIEW */}
              {activeTab === 'dashboard' && (
                <DashboardOverview
                  currentAnalysis={currentAnalysis}
                  isRecording={isRecording}
                  callDuration={callDuration}
                  onNavigateToLive={() => setActiveTab('live')}
                  onNavigateToOTT={() => setActiveTab('ott')}
                  onNavigateToDemos={() => setActiveTab('demos')}
                  onRunScenario={(phrase) => {
                    setActiveTab('live');
                    handleSendManualSpeech(phrase);
                  }}
                  selectedChannel={selectedChannel}
                />
              )}

              {/* TAB: LIVE CALL MONITOR */}
              {activeTab === 'live' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Channel & Capabilities Selector */}
                  <ChannelSelector
                    selectedChannel={selectedChannel}
                    onSelectChannel={(ch) => {
                      setSelectedChannel(ch);
                      setCurrentAnalysis(prev => ({ ...prev, channel: ch }));
                    }}
                    capabilities={currentAnalysis.capabilities}
                  />

                  {/* Operational Status & Action Bar */}
                  <div className="sw-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`status-dot ${isRecording ? 'status-dot-warning' : 'status-dot-active'}`} />
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {isRecording ? `Monitoring Spoken Conversation (${callDuration}s)` : 'Live Voice Shield Armed & Standby'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Continuous neural deepfake detection, intent classification, and credential harvesting defense
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {!isRecording ? (
                        <button onClick={handleStartLiveCall} className="btn-primary" style={{ padding: '8px 16px' }}>
                          <Mic size={15} />
                          <span>Start Monitoring</span>
                        </button>
                      ) : (
                        <button onClick={handleStopLiveCall} className="btn-danger" style={{ padding: '8px 16px' }}>
                          <MicOff size={15} />
                          <span>Stop Monitoring</span>
                        </button>
                      )}

                      <button onClick={handleOpenReport} className="btn-secondary" style={{ padding: '8px 14px' }}>
                        <FileText size={15} />
                        <span>Safety Report</span>
                      </button>

                      <button onClick={() => setIsMobileModalOpen(true)} className="btn-ghost" style={{ padding: '8px 12px' }} title="Preview Android Mobile Alert">
                        <Smartphone size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Manual Speech & Preset Simulator Input Bar */}
                  <div className="sw-card" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <input
                        type="text"
                        placeholder="Simulate or inject live conversation turn (e.g. 'I am calling from SBI, share OTP')..."
                        value={manualInputText}
                        onChange={(e) => setManualInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendManualSpeech(); }}
                        className="sw-input"
                        style={{ flex: 1 }}
                      />
                      <button onClick={() => handleSendManualSpeech()} className="btn-primary" style={{ padding: '8px 16px' }}>
                        <Send size={14} />
                        <span>Analyze</span>
                      </button>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                        1-Click Test Scenarios:
                      </span>
                      {quickTestScenarios.map((scen, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendManualSpeech(scen.phrase)}
                          className="btn-ghost"
                          style={{
                            fontSize: '11.5px',
                            padding: '4px 10px',
                            backgroundColor: 'var(--surface-alt)',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {scen.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Video Integrity Visualizer (if video call) */}
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

                  {/* Main 2-Column Live Protection Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                    {/* Left Column: Trust Score Bar + Recommended Safety Action */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <TrustScoreBar
                        trustScore={currentAnalysis.trustScore}
                        riskScore={currentAnalysis.riskScore}
                        classification={currentAnalysis.classification}
                        category={currentAnalysis.category}
                        voiceAnalysis={currentAnalysis.voiceAnalysis}
                        callerReputation={currentAnalysis.callerReputation}
                        evidence={currentAnalysis.evidence}
                      />

                      <ActionCard
                        recommendation={currentAnalysis.recommendation}
                        actions={currentAnalysis.actions}
                        easyModeSummary={currentAnalysis.easyModeSummary}
                        riskScore={currentAnalysis.riskScore}
                        onEndCall={isRecording ? handleStopLiveCall : null}
                      />
                    </div>

                    {/* Right Column: Caller Identity + Live Transcript */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <IdentityVerificationPanel
                        identityAudit={currentAnalysis.identityAudit}
                        callerReputation={currentAnalysis.callerReputation}
                      />

                      <LiveTranscript
                        transcript={liveTranscript}
                        dialogueTurns={currentAnalysis.dialogueTurns}
                        evidence={currentAnalysis.evidence}
                        suspiciousPhrases={currentAnalysis.suspiciousPhrases}
                        isProvisional={isProvisional}
                      />
                    </div>
                  </div>

                  {/* Attack Timeline & Intent Chain Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                    <AttackTimeline timeline={currentAnalysis.attackTimeline} />
                    <IntentChain intentChain={currentAnalysis.intentChain} />
                  </div>

                  {/* Bottom Assistance Modules (Coaching & Emotional Manipulation) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                    {currentAnalysis.coachingPrompt && (
                      <CoachingPromptCard coachingPrompt={currentAnalysis.coachingPrompt} />
                    )}
                    {currentAnalysis.emotionalManipulation && (
                      <EmotionalManipulationMeter emotionalData={currentAnalysis.emotionalManipulation} />
                    )}
                  </div>
                </div>
              )}

              {/* TAB: CALL HISTORY */}
              {activeTab === 'history' && (
                <HistoryDashboard onSelectSession={(id) => console.log(id)} />
              )}

              {/* TAB: SCAM DEMOS */}
              {activeTab === 'demos' && (
                <DemoWalkthrough onRunLiveScenario={(phrase) => {
                  setActiveTab('live');
                  handleSendManualSpeech(phrase);
                }} />
              )}

              {/* TAB: KNOWLEDGE BASE */}
              {activeTab === 'intelligence' && (
                <ScamKnowledgeBase isFullPage={true} />
              )}

              {/* TAB: AI EVALUATION */}
              {activeTab === 'evaluation' && (
                <EvaluationDashboard isFullPage={true} />
              )}

              {/* TAB: WHATSAPP / OTT */}
              {activeTab === 'ott' && (
                <OTTDashboard />
              )}

              {/* TAB: PRIVACY & DATA */}
              {activeTab === 'privacy' && (
                <PrivacyCenter isFullPage={true} />
              )}

              {/* TAB: AUDIT LEDGER */}
              {activeTab === 'audit' && (
                <AuditLedgerPage sessionId={currentAnalysis.id || 'default-session'} />
              )}

              {/* TAB: CAPABILITIES MATRIX */}
              {activeTab === 'capabilities' && (
                <CapabilitiesPage />
              )}

              {/* TAB: SETTINGS */}
              {activeTab === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                        <SettingsIcon size={18} />
                      </div>
                      <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        System & Administrative Settings
                      </h2>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Manage telemetry parameters, real-time threat thresholds, and notification protocols.
                    </p>
                  </div>

                  <div className="sw-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Screen-Share Fast-Path Intercept</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Instantly escalate to critical tier if screen sharing is active with credential asks</div>
                      </div>
                      <span className="badge badge-success">Always Enforced</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Emergency Audio Disconnection</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Permit 1-tap call termination button on lockscreen overlay</div>
                      </div>
                      <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Audio File Forensic Uploader</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Analyze pre-recorded WAV or MP3 evidence files</div>
                      </div>
                      <button onClick={() => setActiveTab('audio_upload')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        Open File Uploader
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: AUDIO FILE UPLOADER */}
              {activeTab === 'audio_upload' && (
                <div style={{ maxWidth: '800px' }}>
                  <AudioAnalyzer onAnalysisComplete={(result) => {
                    setCurrentAnalysis(prev => ({ ...prev, ...result }));
                    setActiveTab('live');
                  }} />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <MobileCallModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        analysis={currentAnalysis}
        onEndCall={isRecording ? handleStopLiveCall : null}
      />

      <PostCallSafetyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportData={activeReportData}
      />

      <UserFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        analysisId={currentAnalysis.id}
      />

      <ScreenShareAlertModal
        isOpen={isScreenShareAlertOpen}
        onClose={() => setIsScreenShareAlertOpen(false)}
        onStopSharing={() => setIsScreenShareAlertOpen(false)}
        evidenceText={currentAnalysis?.screenShareAnalysis?.matched_patterns?.[0] || 'Caller requested screen access'}
      />
    </div>
  );
}
