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
import { Mic, MicOff, Send, Radio, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('live');
  const [easyMode, setEasyMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

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

      // Request browser microphone
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        // Initialize Web Speech Recognition if supported by browser for zero-latency speech
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
                finalSnippet += event.results[i][0].transcript + ' ';
              }
            }
            if (finalSnippet.trim() && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'TEXT_CHUNK',
                text: finalSnippet.trim(),
                isFinal: false
              }));
            }
          };

          recognition.start();
        }
      }
    } catch (err) {
      console.warn("Microphone not available or permission denied. Manual simulation mode available.", err);
      // Fallback: Continue live session with text simulation
      setIsRecording(true);
      connectWebSocket();
    }
  };

  // Stop live recording & cleanup resources (Section 37)
  const handleStopLiveCall = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'TEXT_CHUNK',
        text: '',
        isFinal: true
      }));
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // Handle manual speech input simulation
  const handleSendManualSpeech = async (textToSend = null) => {
    const text = textToSend || manualInputText;
    if (!text.trim()) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'TEXT_CHUNK',
        text: text,
        isFinal: false
      }));
    } else {
      // Direct REST fallback
      try {
        const res = await fetch('http://localhost:8000/api/analyze-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: liveTranscript ? `${liveTranscript} ${text}` : text })
        });
        const data = await res.json();
        setCurrentAnalysis(data);
        setLiveTranscript(data.transcript);
      } catch (err) {
        console.error(err);
      }
    }
    setManualInputText('');
  };

  // Demo step trigger
  const handleDemoStepSimulate = (accumulatedTranscript, stepConfig) => {
    setLiveTranscript(accumulatedTranscript);
    handleSendManualSpeech(accumulatedTranscript);
  };

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
      />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px', flex: 1, width: '100%' }}>
        {/* TAB 1: LIVE CALL MONITOR */}
        {activeTab === 'live' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Live Controller Bar */}
            <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={isRecording ? 'radar-dot' : 'radar-dot-danger'} />
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                    {isRecording ? 'Live Call Safety Layer Active' : 'Real-Time Protection Standby'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Continuous acoustic deepfake analysis & conversational social engineering verification
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {!isRecording ? (
                  <button onClick={handleStartLiveCall} className="btn-primary" style={{ padding: '12px 24px' }}>
                    <Mic size={18} /> START LIVE MONITORING
                  </button>
                ) : (
                  <button onClick={handleStopLiveCall} className="btn-danger" style={{ padding: '12px 24px' }}>
                    <MicOff size={18} /> STOP MONITORING
                  </button>
                )}
              </div>
            </div>

            {/* Main Interactive Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '22px' }}>
              {/* Left Column: Trust Score Radial & Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                <TrustScoreRing
                  trustScore={currentAnalysis.trustScore}
                  riskScore={currentAnalysis.riskScore}
                  confidence={currentAnalysis.confidence}
                  isProvisional={isProvisional}
                  easyMode={easyMode}
                />

                <ActionCard
                  recommendation={currentAnalysis.recommendation}
                  actions={currentAnalysis.actions}
                  easyModeSummary={currentAnalysis.easyModeSummary}
                  riskScore={currentAnalysis.riskScore}
                  onEndCall={isRecording ? handleStopLiveCall : null}
                  easyMode={easyMode}
                />
              </div>

              {/* Right Column: Waveform, Live Transcript & Evidence */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                <LiveWaveform
                  isRecording={isRecording}
                  voiceAnalysis={currentAnalysis.voiceAnalysis}
                  duration={callDuration}
                />

                <LiveTranscript
                  transcript={liveTranscript || currentAnalysis.transcript}
                  evidence={currentAnalysis.evidence}
                  suspiciousPhrases={currentAnalysis.suspiciousPhrases}
                  isProvisional={isProvisional}
                  easyMode={easyMode}
                />

                {/* Manual Speech Simulator Bar */}
                <div className="glass-panel" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px' }}>
                    Simulate Caller Speech Phrase (or speak via microphone)
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendManualSpeech();
                    }}
                    style={{ display: 'flex', gap: '8px' }}
                  >
                    <input
                      type="text"
                      value={manualInputText}
                      onChange={(e) => setManualInputText(e.target.value)}
                      placeholder='Type speech e.g., "Your account will be blocked. Share the OTP now."'
                      style={{
                        flex: 1,
                        background: 'rgba(10, 16, 30, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                    <button type="submit" className="btn-primary" style={{ padding: '0 18px' }}>
                      <Send size={16} /> Analyze
                    </button>
                  </form>
                </div>

                <EvidenceGroundingCard
                  evidence={currentAnalysis.evidence}
                  category={currentAnalysis.category}
                  aiExplanation={currentAnalysis.aiExplanation}
                  easyMode={easyMode}
                />
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '22px' }}>
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

        {/* TAB 3: DEMO WALKTHROUGH */}
        {activeTab === 'demo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <DemoWalkthrough
              onSimulateStep={handleDemoStepSimulate}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '22px' }}>
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

            <LiveTranscript
              transcript={liveTranscript || currentAnalysis.transcript}
              evidence={currentAnalysis.evidence}
              suspiciousPhrases={currentAnalysis.suspiciousPhrases}
              isProvisional={false}
              easyMode={easyMode}
            />

            <EvidenceGroundingCard
              evidence={currentAnalysis.evidence}
              category={currentAnalysis.category}
              aiExplanation={currentAnalysis.aiExplanation}
              easyMode={easyMode}
            />
          </div>
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
    </div>
  );
}
