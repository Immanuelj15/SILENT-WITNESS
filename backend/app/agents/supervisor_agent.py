from typing import Dict, Any, List, Optional
from backend.app.agents.scam_agent import ScamAgent
from backend.app.agents.intent_agent import IntentAgent
from backend.app.agents.identity_agent import IdentityAgent
from backend.app.agents.evidence_agent import EvidenceAgent
from backend.app.risk.categories import ScamCategory, INDIAN_SCAM_SIGNALS
from backend.app.risk.engine import DeterministicRiskEngine
from backend.app.models.schemas import (
    AnalysisResult,
    AgentAnalysisReport,
    AgentDisagreement,
    VoiceAnalysisResult
)
from backend.app.core.security import detect_prompt_injection_attempt

from backend.app.transcription.diarization import SpeakerDiarizer
from backend.app.risk.attribution import AttributionEngine

class SupervisorAgent:
    """
    Supervisor Agent: Coordinates Scam, Intent, Identity, and Evidence agents.
    Synthesizes findings, surfaces agent disagreements, passes verified claims to the
    deterministic risk engine, generates speaker diarization, and calculates SHAP/feature attributions.
    """

    def __init__(self):
        self.scam_agent = ScamAgent()
        self.intent_agent = IntentAgent()
        self.identity_agent = IdentityAgent()
        self.evidence_agent = EvidenceAgent()
        self.risk_engine = DeterministicRiskEngine()
        self.diarizer = SpeakerDiarizer()
        self.attribution_engine = AttributionEngine()

    def determine_category(
        self,
        transcript: str,
        demands: List[str],
        claimed_identity: Optional[str],
        tactics: List[str]
    ) -> str:
        norm = transcript.lower()

        # Check Indian scam specifics
        for key, info in INDIAN_SCAM_SIGNALS.items():
            if any(kw in norm for kw in info["keywords"]):
                return info["category"].value

        # Check specific category rules
        if any("otp" in d.lower() for d in demands):
            return ScamCategory.OTP_SCAM.value
        if any("upi" in d.lower() for d in demands) or "qr code" in norm:
            return ScamCategory.UPI_SCAM.value
        if claimed_identity and "bank" in claimed_identity.lower():
            return ScamCategory.BANKING_SCAM.value
        if claimed_identity and ("police" in claimed_identity.lower() or "law enforcement" in claimed_identity.lower()):
            return ScamCategory.POLICE_LEGAL_THREAT.value
        if "kyc" in norm and ("block" in norm or "expire" in norm or "update" in norm):
            return ScamCategory.KYC_SCAM.value
        if "lottery" in norm or "prize" in norm or "won" in norm:
            return ScamCategory.LOTTERY_PRIZE_SCAM.value
        if "courier" in norm or "delivery" in norm or "parcel" in norm:
            return ScamCategory.DELIVERY_SCAM.value
        if "job" in norm or "telegram" in norm or "income" in norm:
            return ScamCategory.JOB_SCAM.value
        if "electricity" in norm:
            return ScamCategory.CUSTOMER_CARE_SCAM.value
        if "tech support" in norm or "anydesk" in norm or "teamviewer" in norm:
            return ScamCategory.TECH_SUPPORT_SCAM.value

        if len(demands) > 0 or len(tactics) > 0:
            return ScamCategory.UNKNOWN_SUSPICIOUS.value

        return ScamCategory.LEGITIMATE_CONVERSATION.value

    def process_conversation(
        self,
        transcript: str,
        voice_result: Optional[VoiceAnalysisResult] = None,
        is_provisional: bool = False
    ) -> AnalysisResult:
        # Step 0: Check for prompt injection attacks in transcript
        injection_check = detect_prompt_injection_attempt(transcript)
        prompt_injection_detected = injection_check["detected"]

        # Step 1: Run Sub-agents
        scam_res = self.scam_agent.analyze(transcript)
        intent_res = self.intent_agent.analyze(transcript)
        identity_res = self.identity_agent.analyze(transcript)

        # Step 2: Consolidate proposed evidence candidates
        raw_candidates = (
            scam_res["proposed_evidence"] +
            intent_res["proposed_evidence"] +
            identity_res["proposed_evidence"]
        )

        # Step 3: Evidence Agent filters hallucinated or unsupported claims
        grounded_evidence, rejected_claims = self.evidence_agent.ground_evidence(
            raw_candidates, transcript
        )

        # Step 4: Disagreement & Discrepancy Analysis
        disagreements: List[AgentDisagreement] = []
        if identity_res["claimed_identity"] and intent_res["fraud_intent_score"] == 0.0 and scam_res["scam_risk"] == 0.0:
            disagreements.append(AgentDisagreement(
                agent_a="IdentityAgent",
                agent_b="IntentAgent",
                discrepancy_detail=f"Caller claims identity '{identity_res['claimed_identity']}' but no malicious intent or demands yet observed."
            ))
        if intent_res["demands"] and scam_res["threat_score"] == 0.0 and scam_res["social_engineering_score"] == 0.0:
            disagreements.append(AgentDisagreement(
                agent_a="IntentAgent",
                agent_b="ScamAgent",
                discrepancy_detail="Caller requested an action/credential, but did not apply overt intimidation or urgency tactics."
            ))

        # Voice metrics input
        voice_risk = voice_result.voiceRisk if voice_result else 15.0

        # Step 5: Deterministic Risk Engine computes transparent score
        risk_score, trust_score, breakdown, classification, recommendation, actions, easy_summary = (
            self.risk_engine.compute_risk(
                voice_risk=voice_risk,
                social_engineering_risk=scam_res["social_engineering_score"],
                fraud_intent_risk=intent_res["fraud_intent_score"],
                identity_risk=identity_res["identity_risk_score"],
                threat_risk=scam_res["threat_score"],
                evidence_items=grounded_evidence,
                prompt_injection_detected=prompt_injection_detected
            )
        )

        # Determine Category
        category = self.determine_category(
            transcript,
            intent_res["demands"],
            identity_res["claimed_identity"],
            scam_res["detected_tactics"]
        )

        # Risk Factors extraction
        risk_factors = []
        if any("otp" in d.lower() for d in intent_res["demands"]):
            risk_factors.append("OTP / Credential Request")
        if any("pin" in d.lower() for d in intent_res["demands"]):
            risk_factors.append("PIN Solicitation")
        if scam_res["social_engineering_score"] > 30:
            risk_factors.append("Urgency & Psychological Pressure")
        if scam_res["threat_score"] > 30:
            risk_factors.append("Threat / Intimidation")
        if identity_res["claimed_identity"]:
            risk_factors.append(f"Unverified Claim: {identity_res['claimed_identity']}")
        if voice_result and voice_result.is_synthetic_suspected:
            risk_factors.append("Acoustic Synthetic Voice Anomaly")
        if prompt_injection_detected:
            risk_factors.append("Adversarial Prompt Injection Attempt")

        suspicious_phrases = [e.exact_phrase for e in grounded_evidence]

        # Calculate model confidence (Risk != Confidence)
        confidence_samples = [scam_res["confidence"], intent_res["confidence"], identity_res["confidence"]]
        avg_confidence = round(sum(confidence_samples) / len(confidence_samples), 2)
        if voice_result:
            avg_confidence = round((avg_confidence + voice_result.confidence) / 2.0, 2)

        # Synthesize AI Explanation
        if risk_score > 60:
            explanation = (
                f"The call shows dangerous signals: {', '.join(risk_factors) if risk_factors else 'High risk behavior'}. "
                f"The caller demands immediate compliance. Never share security codes or transfer money on unverified calls."
            )
        elif risk_score > 30:
            explanation = (
                f"Suspicious activity detected: {', '.join(risk_factors) if risk_factors else 'Unusual inquiries'}. "
                f"Proceed with caution and independently verify the caller's credentials."
            )
        else:
            explanation = "Conversation patterns appear normal and consistent with legitimate interactions. No coercion or credential harvesting identified."

        agent_report = AgentAnalysisReport(
            scam_agent_findings=scam_res["detected_tactics"],
            intent_agent_demands=intent_res["demands"],
            identity_agent_claimed=identity_res["claimed_identity"],
            identity_verified=False,
            evidence_agent_rejected_claims=rejected_claims,
            disagreements=disagreements
        )

        # Compute Section 3.B Speaker Diarization Turns
        diarized_turns = [t.model_dump() for t in self.diarizer.segment_transcript_into_turns(transcript)]

        # Compute Section 3.F & 7 Feature Attributions and Severity Tier
        attributions = [a.model_dump() for a in self.attribution_engine.compute_attributions(
            evidence_items=grounded_evidence,
            demands=intent_res["demands"],
            tactics=scam_res["detected_tactics"],
            claimed_identity=identity_res["claimed_identity"],
            voice_risk=voice_risk,
            is_synthetic=(voice_result.is_synthetic_suspected if voice_result else False)
        )]

        severity_tier = self.attribution_engine.get_severity_tier(trust_score)

        timeline_point = {
            "timestamp_sec": round(len(transcript.split()) * 0.4, 1),
            "trust_score": trust_score,
            "severity_tier": severity_tier["tier"],
            "primary_event": risk_factors[0] if risk_factors else "Normal Dialogue",
            "active_deductions": attributions
        }

        return AnalysisResult(
            classification=classification,
            riskScore=risk_score,
            trustScore=trust_score,
            confidence=avg_confidence,
            category=category,
            transcript=transcript,
            is_provisional=is_provisional,
            riskFactors=risk_factors,
            suspiciousPhrases=suspicious_phrases,
            evidence=grounded_evidence,
            recommendation=recommendation,
            actions=actions,
            easyModeSummary=easy_summary,
            aiExplanation=explanation,
            voiceAnalysis=voice_result,
            subScores=breakdown,
            agentReport=agent_report,
            dialogueTurns=diarized_turns,
            attributions=attributions,
            severityTier=severity_tier,
            timeline=[timeline_point]
        )
