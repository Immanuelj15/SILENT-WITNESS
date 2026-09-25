from typing import Dict, Any, List, Tuple
from backend.app.core.config import settings
from backend.app.models.schemas import RiskBreakdown, EvidenceItem
from backend.app.risk.categories import ScamCategory

class DeterministicRiskEngine:
    """
    Transparent, Deterministic Risk Engine.
    Uses configurable weighted components rather than opaque black-box scoring.
    Trust Score = 100 - Risk Score.
    """

    def __init__(
        self,
        weight_voice: float = None,
        weight_social_eng: float = None,
        weight_fraud_intent: float = None,
        weight_identity: float = None,
        weight_threat: float = None,
        weight_evidence: float = None
    ):
        has_custom_weights = any(w is not None for w in [weight_voice, weight_social_eng, weight_fraud_intent, weight_identity, weight_threat])
        self.w_voice = weight_voice if weight_voice is not None else settings.WEIGHT_VOICE_RISK
        self.w_social = weight_social_eng if weight_social_eng is not None else settings.WEIGHT_SOCIAL_ENGINEERING
        self.w_intent = weight_fraud_intent if weight_fraud_intent is not None else settings.WEIGHT_FRAUD_INTENT
        self.w_identity = weight_identity if weight_identity is not None else settings.WEIGHT_IDENTITY_RISK
        self.w_threat = weight_threat if weight_threat is not None else settings.WEIGHT_THREAT_RISK
        
        if weight_evidence is not None:
            self.w_evidence = weight_evidence
        elif has_custom_weights:
            self.w_evidence = 0.0
        else:
            self.w_evidence = settings.WEIGHT_EVIDENCE_RISK

        # Normalize weights to ensure sum == 1.0
        total = self.w_voice + self.w_social + self.w_intent + self.w_identity + self.w_threat + self.w_evidence
        if total > 0:
            self.w_voice /= total
            self.w_social /= total
            self.w_intent /= total
            self.w_identity /= total
            self.w_threat /= total
            self.w_evidence /= total

    def compute_risk(
        self,
        voice_risk: float,
        social_engineering_risk: float,
        fraud_intent_risk: float,
        identity_risk: float,
        threat_risk: float,
        evidence_items: List[EvidenceItem],
        evidence_risk: float = 0.0,
        prompt_injection_detected: bool = False,
        is_insufficient_context: bool = False
    ) -> Tuple[int, int, RiskBreakdown, str, str, List[str], str, float]:
        """
        Computes (risk_score, trust_score, breakdown, classification, recommendation, actions, easy_summary, evidence_confidence).
        Implements Section 45 risk states: SAFE, CAUTION, SUSPICIOUS, HIGH_RISK, CRITICAL, INCONCLUSIVE.
        """
        # If insufficient reliable context to evaluate conversation
        if is_insufficient_context:
            breakdown = RiskBreakdown(
                voice_risk=round(voice_risk, 1),
                social_engineering_risk=round(social_engineering_risk, 1),
                fraud_intent_risk=round(fraud_intent_risk, 1),
                identity_risk=round(identity_risk, 1),
                threat_risk=round(threat_risk, 1),
                evidence_risk=0.0,
                weights_used={
                    "voice_risk": round(self.w_voice, 3),
                    "social_engineering": round(self.w_social, 3),
                    "fraud_intent": round(self.w_intent, 3),
                    "identity_risk": round(self.w_identity, 3),
                    "threat_risk": round(self.w_threat, 3),
                    "evidence_risk": round(self.w_evidence, 3)
                }
            )
            breakdown.evidence_confidence = 0.30
            return (
                0,
                100,
                breakdown,
                "INCONCLUSIVE",
                "NOT ENOUGH RELIABLE EVIDENCE",
                ["Continue monitoring call", "Awaiting sufficient speech context"],
                "Not enough conversation data yet to determine safety."
            )

        # Ensure raw components are bound within [0.0, 100.0]
        v_score = max(0.0, min(100.0, float(voice_risk)))
        s_score = max(0.0, min(100.0, float(social_engineering_risk)))
        i_score = max(0.0, min(100.0, float(fraud_intent_risk)))
        id_score = max(0.0, min(100.0, float(identity_risk)))
        t_score = max(0.0, min(100.0, float(threat_risk)))

        # Derive evidence risk from grounded suspicious findings
        grounded_items = [e for e in evidence_items if getattr(e, "is_grounded_in_transcript", True)]
        if grounded_items:
            e_score = min(100.0, len(grounded_items) * 25.0)
            evidence_confidence = min(0.99, 0.70 + (len(grounded_items) * 0.08))
        else:
            e_score = max(0.0, min(100.0, float(evidence_risk)))
            evidence_confidence = 0.50

        # If prompt injection was attempted inside conversation, elevate threat
        if prompt_injection_detected:
            s_score = max(s_score, 85.0)
            t_score = max(t_score, 85.0)
            e_score = max(e_score, 90.0)

        # High-severity override rule: direct OTP / PIN solicitation with urgency
        # guarantees a severe risk floor regardless of acoustic score
        has_otp_demand = any("otp" in e.detected_tag.lower() or "credential" in e.detected_tag.lower() for e in evidence_items)
        has_urgency = any("urgency" in e.detected_tag.lower() or "threat" in e.detected_tag.lower() for e in evidence_items)
        
        weighted_risk = (
            (self.w_voice * v_score) +
            (self.w_social * s_score) +
            (self.w_intent * i_score) +
            (self.w_identity * id_score) +
            (self.w_threat * t_score) +
            (self.w_evidence * e_score)
        )

        # Deterministic Safety Override: If a caller demands an OTP under urgency, risk cannot be low
        if has_otp_demand and has_urgency:
            weighted_risk = max(weighted_risk, 88.0)
        elif has_otp_demand:
            weighted_risk = max(weighted_risk, 75.0)

        # Extortion / Digital Arrest / Law Enforcement Intimidation Override
        has_extortion_threat = any("arrest" in e.exact_phrase.lower() or "digital arrest" in e.exact_phrase.lower() for e in evidence_items)
        if has_extortion_threat and (t_score >= 40.0 or id_score >= 60.0):
            weighted_risk = max(weighted_risk, 82.0)

        # Advance Fee / Task Scam / Fake Job Deposit Override
        has_advance_fee = any("deposit" in e.exact_phrase.lower() or "registration fee" in e.exact_phrase.lower() for e in evidence_items)
        has_task_lure = any("task" in e.context_note.lower() or "job" in e.context_note.lower() or "income" in e.exact_phrase.lower() for e in evidence_items)
        if has_advance_fee and (has_task_lure or i_score >= 60.0):
            weighted_risk = max(weighted_risk, 72.0)

        final_risk = int(round(max(0.0, min(100.0, weighted_risk))))
        trust_score = max(0, 100 - final_risk)

        breakdown = RiskBreakdown(
            voice_risk=round(v_score, 1),
            social_engineering_risk=round(s_score, 1),
            fraud_intent_risk=round(i_score, 1),
            identity_risk=round(id_score, 1),
            threat_risk=round(t_score, 1),
            evidence_risk=round(e_score, 1),
            evidence_confidence=round(evidence_confidence, 2),
            weights_used={
                "voice_risk": round(self.w_voice, 3),
                "social_engineering": round(self.w_social, 3),
                "fraud_intent": round(self.w_intent, 3),
                "identity_risk": round(self.w_identity, 3),
                "threat_risk": round(self.w_threat, 3),
                "evidence_risk": round(self.w_evidence, 3)
            }
        )

        # Classification based on Section 45 configurable thresholds
        if final_risk <= settings.THRESHOLD_SAFE:
            classification = "SAFE"
            recommendation = "CONVERSATION APPEARS SAFE"
            actions = ["Continue normally", "Verify details if unexpected"]
            easy_summary = "Everything seems normal with this call. No scam signs found."
        elif final_risk <= settings.THRESHOLD_CAUTION:
            classification = "CAUTION"
            recommendation = "PROCEED WITH CAUTION"
            actions = ["Be cautious", "Do not share unverified personal info"]
            easy_summary = "Be cautious. The caller is asking questions that require care."
        elif final_risk <= settings.THRESHOLD_SUSPICIOUS:
            classification = "SUSPICIOUS"
            recommendation = "STAY ALERT"
            actions = ["Do not share unverified personal info", "Ask caller for verification reference"]
            easy_summary = "Be careful. The caller is asking for details that might not be necessary."
        elif final_risk <= settings.THRESHOLD_HIGH:
            classification = "HIGH_RISK"
            recommendation = "BE CAREFUL - DO NOT COMPLY"
            actions = ["Do not transfer money or share credentials", "Hang up and call official number"]
            easy_summary = "Warning! This caller is using pressure tactics. Do not share any details."
        else:
            classification = "CRITICAL"
            recommendation = "STOP AND VERIFY"
            actions = ["DO NOT SHARE OTP OR PIN", "END CALL IMMEDIATELY", "VERIFY THROUGH OFFICIAL CHANNEL"]
            easy_summary = "🚨 DANGER: This is almost certainly a scam call! Hang up immediately."

        return final_risk, trust_score, breakdown, classification, recommendation, actions, easy_summary
