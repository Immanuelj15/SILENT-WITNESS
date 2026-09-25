from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from backend.app.risk.categories import ScamCategory

class VoiceAcousticMetrics(BaseModel):
    spectral_centroid: float = 0.0
    spectral_flatness: float = 0.0
    zero_crossing_rate: float = 0.0
    energy_variance: float = 0.0
    pitch_jitter: float = 0.0
    pitch_shimmer: float = 0.0
    speaking_rate_wpm: float = 0.0
    synthetic_artifact_score: float = 0.0

class VoiceAnalysisResult(BaseModel):
    voiceRisk: float = Field(0.0, description="0 to 100 voice deepfake risk")
    confidence: float = Field(0.5, description="0.0 to 1.0 model confidence in voice assessment")
    indicators: List[str] = Field(default_factory=list)
    metrics: VoiceAcousticMetrics = Field(default_factory=VoiceAcousticMetrics)
    is_synthetic_suspected: bool = False

class EvidenceItem(BaseModel):
    exact_phrase: str
    detected_tag: str  # e.g., "Urgency", "Threat", "Sensitive Credential", "Identity Claim"
    is_grounded_in_transcript: bool = True
    context_note: str

class RiskBreakdown(BaseModel):
    voice_risk: float = 0.0
    social_engineering_risk: float = 0.0
    fraud_intent_risk: float = 0.0
    identity_risk: float = 0.0
    threat_risk: float = 0.0
    evidence_risk: float = 0.0
    evidence_confidence: float = 0.90
    weights_used: Dict[str, float] = Field(default_factory=dict)

class AgentDisagreement(BaseModel):
    agent_a: str
    agent_b: str
    discrepancy_detail: str

class AgentAnalysisReport(BaseModel):
    scam_agent_findings: List[str] = Field(default_factory=list)
    intent_agent_demands: List[str] = Field(default_factory=list)
    identity_agent_claimed: Optional[str] = None
    identity_verified: bool = False
    evidence_agent_rejected_claims: List[str] = Field(default_factory=list)
    disagreements: List[AgentDisagreement] = Field(default_factory=list)

class AnalysisResult(BaseModel):
    id: Optional[str] = None
    success: bool = True
    classification: str = "SAFE"  # SAFE, SUSPICIOUS, HIGH_RISK, VERY_HIGH_RISK, LIKELY_SCAM
    riskScore: int = 0  # 0 to 100
    trustScore: int = 100  # 100 - riskScore
    confidence: float = 0.85  # Model confidence (0.0 to 1.0)
    evidenceConfidence: float = 0.90  # Evidence confidence (0.0 to 1.0)
    category: str = ScamCategory.LEGITIMATE_CONVERSATION.value
    transcript: str = ""
    is_provisional: bool = False
    riskFactors: List[str] = Field(default_factory=list)
    suspiciousPhrases: List[str] = Field(default_factory=list)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    recommendation: str = "CONVERSATION APPEARS SAFE"
    actions: List[str] = Field(default_factory=list)
    easyModeSummary: str = "Everything seems normal with this conversation."
    aiExplanation: str = "No critical social-engineering or credential solicitation signals detected."
    voiceAnalysis: Optional[VoiceAnalysisResult] = None
    subScores: Optional[RiskBreakdown] = None
    agentReport: Optional[AgentAnalysisReport] = None
    dialogueTurns: List[Dict[str, Any]] = Field(default_factory=list)
    attributions: List[Dict[str, Any]] = Field(default_factory=list)
    severityTier: Dict[str, str] = Field(default_factory=dict)
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    intentChain: Optional[Dict[str, Any]] = None
    identityAudit: Optional[Dict[str, Any]] = None
    intervention: Optional[Dict[str, Any]] = None
    multilingual: Optional[Dict[str, Any]] = None
    scriptFingerprint: Optional[Dict[str, Any]] = None
    emotionAnalysis: Optional[Dict[str, Any]] = None
    coaching: Optional[Dict[str, Any]] = None
    callerReputation: Optional[Dict[str, Any]] = None
    auditBlock: Optional[Dict[str, Any]] = None
    channel: str = "SIM_CALL"
    capabilities: Optional[Dict[str, Any]] = None
    screenShareAnalysis: Optional[Dict[str, Any]] = None
    videoAnalysisResult: Optional[Dict[str, Any]] = None
    latency_ms: Optional[float] = None
    created_at: Optional[str] = None

class AnalyzeTextRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Transcript text to analyze")
    channel: Optional[str] = Field("SIM_CALL", description="Communication channel (SIM_CALL, WHATSAPP, VIDEO_CALL, OWN_VOIP, etc.)")

class AudioUploadResponse(BaseModel):
    success: bool
    message: str
    analysis: Optional[AnalysisResult] = None

class LiveStreamChunk(BaseModel):
    session_id: str
    audio_base64: Optional[str] = None
    text_chunk: Optional[str] = None
    is_final: bool = False

class CallSessionSummary(BaseModel):
    id: str
    created_at: str
    classification: str
    riskScore: int
    trustScore: int
    category: str
    duration_sec: float
    snippet: str

class UserFeedbackRequest(BaseModel):
    call_id: str
    user_label: str  # "SCAM", "LEGITIMATE", "FALSE_ALARM"
    notes: Optional[str] = None
    reported_missed_signals: List[str] = Field(default_factory=list)

class UserFeedbackResponse(BaseModel):
    success: bool
    message: str
    calibrated_adjustment: str


# ── OTT Edition Schemas ──────────────────────────────────────────────────────

class OTTCallerContext(BaseModel):
    """App-layer caller identity signals for OTT call sessions."""
    phone_number: Optional[str] = None
    is_saved_contact: bool = False
    contact_name: Optional[str] = None
    caller_display_name: Optional[str] = None
    caller_profile_text: Optional[str] = None
    account_age_days: Optional[int] = None
    call_origin: str = Field("DIRECT_DIAL",
        description="One of: BROADCAST, FORWARDED_LINK, GROUP_ADD, UNSOLICITED_CHAT, KNOWN_CONTACT, SAVED_CONTACT, DIRECT_DIAL")
    is_video_call: bool = False
    chat_messages_before_call: int = 0
    has_unsolicited_link_before_call: bool = False
    user_typical_country_codes: Optional[List[str]] = None

class OTTAnalyzeRequest(BaseModel):
    """REST endpoint body for OTT text + identity analysis."""
    text: str = Field(..., min_length=1)
    caller_context: Optional[OTTCallerContext] = None
    screen_share_active: bool = False
    screen_share_coercion_detected: bool = False
    video_extortion_pattern: bool = False
    links_in_chat: List[str] = Field(default_factory=list)
    channel: str = Field("WHATSAPP", description="OTT channel: WHATSAPP, TELEGRAM, VOIP, OWN_VOIP")

class OTTFastPathAlert(BaseModel):
    """Emitted when a fast-path override fires."""
    triggered: bool = False
    rule_name: Optional[str] = None
    label: Optional[str] = None
    recommended_action: Optional[str] = None
    risk_floor: Optional[int] = None
    emergency_actions: List[Dict[str, str]] = Field(default_factory=list)

class OTTAnalysisResult(BaseModel):
    """Complete OTT analysis result combining NLP + identity + OTT fusion."""
    session_id: Optional[str] = None
    ott_risk_score: int = 0
    ott_trust_score: int = 100
    classification: str = "SAFE"
    severity_label: str = "APPEARS SAFE"
    fast_path_triggered: bool = False
    fast_path_alert: Optional[OTTFastPathAlert] = None
    identity_analysis: Optional[Dict[str, Any]] = None
    screen_share_analysis: Optional[Dict[str, Any]] = None
    link_analysis: Optional[Dict[str, Any]] = None
    ott_signals: List[str] = Field(default_factory=list)
    attribution: Optional[Dict[str, Any]] = None
    nlp_analysis: Optional[AnalysisResult] = None
    channel: str = "WHATSAPP"
    created_at: Optional[str] = None
