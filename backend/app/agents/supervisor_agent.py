from typing import Dict, Any, List, Optional
from backend.app.agents.scam_agent import ScamAgent
from backend.app.agents.intent_agent import IntentAgent
from backend.app.agents.identity_agent import IdentityAgent
from backend.app.agents.evidence_agent import EvidenceAgent
from backend.app.agents.social_engineering_agent import SocialEngineeringAgent
from backend.app.agents.screen_agent import screen_agent
from backend.app.agents.video_agent import video_agent
from backend.app.communication.channel import CommunicationChannel, get_default_capabilities_for_channel
from backend.app.services.identity_verifier import caller_identity_verifier
from backend.app.services.intent_chain import intent_chain_engine
from backend.app.services.timeline import timeline_engine
from backend.app.services.intervention import intervention_engine
from backend.app.services.multilingual import multilingual_engine
from backend.app.services.caller_reputation import caller_reputation_service
from backend.app.services.script_fingerprint import script_fingerprint_engine
from backend.app.services.emotion_engine import emotion_engine
from backend.app.services.coaching import coaching_engine
from backend.app.services.audit_logger import get_or_create_ledger
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
    Supervisor Agent: Coordinates Scam, Intent, Identity, Evidence, and Social Engineering agents.
    Synthesizes findings, surfaces agent disagreements, validates identity with official registries,
    builds the sequential Scam Intent Chain and Attack Timeline, computes active intervention tiers,
    and calculates transparent deterministic risk scores.
    """

    def __init__(self):
        self.scam_agent = ScamAgent()
        self.intent_agent = IntentAgent()
        self.identity_agent = IdentityAgent()
        self.evidence_agent = EvidenceAgent()
        self.social_engineering_agent = SocialEngineeringAgent()
        self.screen_agent = screen_agent
        self.video_agent = video_agent
        self.identity_verifier = caller_identity_verifier
        self.intent_chain_engine = intent_chain_engine
        self.timeline_engine = timeline_engine
        self.intervention_engine = intervention_engine
        self.multilingual_engine = multilingual_engine
        self.caller_reputation_service = caller_reputation_service
        self.script_fingerprint_engine = script_fingerprint_engine
        self.emotion_engine = emotion_engine
        self.coaching_engine = coaching_engine
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
        is_provisional: bool = False,
        session_id: Optional[str] = None,
        phone_number: Optional[str] = None,
        caller_is_contact: bool = False,
        contact_name: Optional[str] = None,
        channel: str = "SIM_CALL",
        frame_metadata: Optional[Dict[str, Any]] = None
    ) -> AnalysisResult:
        # Step 0: Check for prompt injection attacks in transcript
        injection_check = detect_prompt_injection_attempt(transcript)
        prompt_injection_detected = injection_check["detected"]

        # Step 0.5: Multilingual & Code-Switching Detection (preserves verbatim)
        multilingual_res = self.multilingual_engine.analyze_language(transcript)

        # Step 1: Run Sub-agents
        scam_res = self.scam_agent.analyze(transcript)
        intent_res = self.intent_agent.analyze(transcript)
        identity_res = self.identity_agent.analyze(transcript)
        soc_eng_res = self.social_engineering_agent.analyze(transcript)
        screen_res = self.screen_agent.analyze(transcript)
        video_res = self.video_agent.analyze(transcript, frame_metadata)

        # Step 1.5: Verify caller identity claim against official registry
        identity_audit = self.identity_verifier.verify_caller_claim(
            claimed_name=identity_res.get("claimed_identity"),
            claimed_org=None,
            caller_phone=None,
            transcript=transcript
        )

        # Step 2: Consolidate proposed evidence candidates
        raw_candidates = (
            scam_res["proposed_evidence"] +
            intent_res["proposed_evidence"] +
            identity_res["proposed_evidence"] +
            soc_eng_res.get("proposed_evidence", []) +
            screen_res.get("proposed_evidence", []) +
            video_res.get("proposed_evidence", [])
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

        # Combine social engineering risk with scam agent urgency/threat
        combined_soc_eng = max(scam_res["social_engineering_score"], soc_eng_res.get("social_engineering_risk", 0.0))
        identity_risk_val = max(identity_res["identity_risk_score"], identity_audit.get("riskScore", 0.0))

        # Voice metrics input
        voice_risk = voice_result.voiceRisk if voice_result else 15.0

        # Step 5: Deterministic Risk Engine computes transparent score
        risk_score, trust_score, breakdown, classification, recommendation, actions, easy_summary = (
            self.risk_engine.compute_risk(
                voice_risk=voice_risk,
                social_engineering_risk=combined_soc_eng,
                fraud_intent_risk=intent_res["fraud_intent_score"],
                identity_risk=identity_risk_val,
                threat_risk=scam_res["threat_score"],
                evidence_items=grounded_evidence,
                prompt_injection_detected=prompt_injection_detected,
                screen_share_risk=screen_res["screen_share_risk"],
                visual_risk=video_res["visual_risk"]
            )
        )
        evidence_confidence = getattr(breakdown, "evidence_confidence", 0.90)

        # Determine Category
        category = self.determine_category(
            transcript,
            intent_res["demands"],
            identity_res["claimed_identity"],
            scam_res["detected_tactics"]
        )
        if video_res.get("is_extortion"):
            category = "VIDEO_EXTORTION"
        elif screen_res.get("is_screen_share_demanded"):
            category = "SCREEN_SHARE_SCAM"

        # Risk Factors extraction
        risk_factors = []
        if screen_res.get("is_screen_share_demanded"):
            risk_factors.append("Screen-Sharing Coercion Detected")
            actions.insert(0, "STOP SCREEN SHARING IMMEDIATELY")
        if video_res.get("is_extortion"):
            risk_factors.append("Video Recording Extortion Pattern")
            actions.insert(0, "DISCONNECT CAMERA & END CALL")
        if any("otp" in d.lower() for d in intent_res["demands"]):
            risk_factors.append("OTP / Credential Request")
        if any("pin" in d.lower() for d in intent_res["demands"]):
            risk_factors.append("PIN Solicitation")
        if combined_soc_eng > 30:
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
        confidence_samples = [scam_res["confidence"], intent_res["confidence"], identity_res["confidence"], soc_eng_res.get("confidence", 0.85)]
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
            scam_agent_findings=scam_res["detected_tactics"] + soc_eng_res.get("detected_vectors", []),
            intent_agent_demands=intent_res["demands"],
            identity_agent_claimed=identity_res["claimed_identity"],
            identity_verified=(identity_audit.get("verificationStatus") == "VERIFIED"),
            evidence_agent_rejected_claims=rejected_claims,
            disagreements=disagreements
        )

        # Compute Section 3.B Speaker Diarization Turns
        diarized_turns = [t.model_dump() for t in self.diarizer.segment_transcript_into_turns(transcript)]

        # Compute Section 15 & 16 Scam Intent Chain
        intent_chain = self.intent_chain_engine.build_intent_chain(
            transcript=transcript,
            dialogue_turns=diarized_turns,
            evidence_items=grounded_evidence
        )

        # Compute Section 19 & 20 Attack Timeline
        attack_timeline = self.timeline_engine.build_timeline(
            transcript=transcript,
            dialogue_turns=diarized_turns,
            evidence_items=grounded_evidence
        )

        # Compute Section 21 & 22 Active Intervention
        intervention = self.intervention_engine.evaluate_intervention(
            trust_score=trust_score,
            risk_score=risk_score,
            primary_signals=risk_factors,
            evidence_items=grounded_evidence,
            identity_verified=(identity_audit.get("verificationStatus") == "VERIFIED")
        )

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

        # Compute Tier 2 & Tier 3 Intelligence:
        # 1. Script Fingerprint
        script_match = self.script_fingerprint_engine.match_transcript(
            [t.get("text", "") for t in diarized_turns] if diarized_turns else [transcript]
        )

        # 2. Emotional Manipulation & User Stress Sub-score
        emotion_res = self.emotion_engine.analyze_turns(diarized_turns)

        # 3. Real-Time Coaching Prompts
        coaching_res = self.coaching_engine.get_coaching_prompt(
            intent_type=(intent_res["demands"][0] if intent_res["demands"] else ""),
            risk_level=classification,
            scam_category=category
        )

        # 4. Caller Reputation & Risk Tiering
        caller_rep = None
        if phone_number:
            caller_rep = self.caller_reputation_service.evaluate_caller(
                phone_number=phone_number,
                is_in_contacts=caller_is_contact,
                contact_name=contact_name
            )

        # 5. Tamper-Evident Audit Ledger Block
        audit_block_data = None
        effective_session_id = session_id or "default-session"
        ledger = get_or_create_ledger(effective_session_id)
        block = ledger.add_block(
            event_type="ANALYSIS_EVALUATION",
            data={
                "riskScore": risk_score,
                "trustScore": trust_score,
                "classification": classification,
                "category": category,
                "groundedEvidenceCount": len(grounded_evidence),
                "scriptMatched": script_match.get("matched", False),
                "emotionalScore": emotion_res.get("emotional_manipulation_score", 0)
            }
        )
        audit_block_data = block.to_dict()

        # Channel capabilities
        try:
            chan_enum = CommunicationChannel(channel)
        except Exception:
            chan_enum = CommunicationChannel.SIM_CALL
        chan_caps = get_default_capabilities_for_channel(chan_enum).to_dict()

        return AnalysisResult(
            classification=classification,
            riskScore=risk_score,
            trustScore=trust_score,
            confidence=avg_confidence,
            evidenceConfidence=evidence_confidence,
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
            timeline=attack_timeline,
            intentChain=intent_chain,
            identityAudit=identity_audit,
            intervention=intervention,
            multilingual=multilingual_res,
            scriptFingerprint=script_match,
            emotionAnalysis=emotion_res,
            coaching=coaching_res,
            callerReputation=caller_rep,
            auditBlock=audit_block_data,
            channel=chan_enum.value,
            capabilities=chan_caps,
            screenShareAnalysis=screen_res,
            videoAnalysisResult=video_res
        )
