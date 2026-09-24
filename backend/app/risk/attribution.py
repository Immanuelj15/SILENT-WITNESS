from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class FeatureAttribution(BaseModel):
    feature_name: str
    signal_type: str  # "VOICE", "INTENT", "SCAM_TACTIC", "IDENTITY", "THREAT"
    deduction_points: int  # e.g., -15, -20
    description: str
    exact_evidence_phrase: Optional[str] = None

class TrustScoreTimelinePoint(BaseModel):
    timestamp_sec: float
    trust_score: int
    severity_tier: str  # "MONITOR", "CAUTION", "WARN", "BLOCK_RECOMMEND_HANGUP"
    primary_event: str
    active_deductions: List[FeatureAttribution] = Field(default_factory=list)

class AttributionEngine:
    """
    Interpretable Feature-Attribution & Time-Series Engine.
    Converts multi-agent and acoustic findings into additive point deductions
    (e.g., -25 for OTP solicitation, -15 for urgency language, -20 for synthetic voice)
    and maps the Trust Score into Section 7 exact severity tiers.
    """

    @staticmethod
    def get_severity_tier(trust_score: int) -> Dict[str, str]:
        """
        Maps Trust Score (0-100) to Section 7 exact severity tiers:
        - 80-100: Monitor
        - 50-79: Caution
        - 25-49: Warn
        - 0-24: Block / Recommend Hangup
        """
        if trust_score >= 80:
            return {
                "tier": "MONITOR",
                "label": "80–100 (Monitor)",
                "action": "No action needed, continue normal monitoring",
                "color": "#10b981"
            }
        elif trust_score >= 50:
            return {
                "tier": "CAUTION",
                "label": "50–79 (Caution)",
                "action": "Soft in-app notice, no interruption",
                "color": "#f59e0b"
            }
        elif trust_score >= 25:
            return {
                "tier": "WARN",
                "label": "25–49 (Warn)",
                "action": "Visible alert banner with explanation",
                "color": "#f97316"
            }
        else:
            return {
                "tier": "BLOCK_RECOMMEND_HANGUP",
                "label": "0–24 (Block/Recommend Hangup)",
                "action": "Strong warning, explicit recommendation to end the call and verify independently",
                "color": "#ef4444"
            }

    @classmethod
    def compute_attributions(
        cls,
        evidence_items: list,
        demands: list,
        tactics: list,
        claimed_identity: Optional[str],
        voice_risk: float,
        is_synthetic: bool
    ) -> List[FeatureAttribution]:
        """
        Generates granular additive SHAP/feature attribution logs.
        """
        attributions = []

        # 1. OTP / PIN / Credential Demands
        has_otp = any("otp" in str(d).lower() for d in demands)
        has_pin = any("pin" in str(d).lower() for d in demands)

        if has_otp:
            attributions.append(FeatureAttribution(
                feature_name="OTP Request",
                signal_type="INTENT",
                deduction_points=-35,
                description="Caller demanded one-time verification code (OTP). High fraud risk.",
                exact_evidence_phrase=next((e.exact_phrase for e in evidence_items if "otp" in e.detected_tag.lower()), "tell me the OTP")
            ))
        elif has_pin:
            attributions.append(FeatureAttribution(
                feature_name="PIN Solicitation",
                signal_type="INTENT",
                deduction_points=-30,
                description="Caller demanded secret banking/UPI PIN.",
                exact_evidence_phrase=next((e.exact_phrase for e in evidence_items if "pin" in e.detected_tag.lower()), "enter PIN")
            ))

        # 2. Urgency & Intimidation
        if any("urgency" in str(t).lower() or "suspension" in str(t).lower() for t in tactics):
            attributions.append(FeatureAttribution(
                feature_name="Urgency & Pressure Language",
                signal_type="SCAM_TACTIC",
                deduction_points=-15,
                description="Artificial deadline used to induce panic and force hurried compliance.",
                exact_evidence_phrase=next((e.exact_phrase for e in evidence_items if "urgency" in e.detected_tag.lower() or "threat" in e.detected_tag.lower()), "blocked today")
            ))

        # 3. Unverified Authority Impersonation
        if claimed_identity:
            attributions.append(FeatureAttribution(
                feature_name=f"Unverified Claim: {claimed_identity}",
                signal_type="IDENTITY",
                deduction_points=-10,
                description=f"Caller claims to be {claimed_identity}. Claimed Identity ≠ Verified Identity.",
                exact_evidence_phrase=next((e.exact_phrase for e in evidence_items if "identity" in e.detected_tag.lower()), claimed_identity)
            ))

        # 4. Synthetic Voice Anomaly
        if is_synthetic or voice_risk > 60:
            attributions.append(FeatureAttribution(
                feature_name="Synthetic Voice / Cloning Artifacts",
                signal_type="VOICE",
                deduction_points=-20,
                description="Acoustic features display phase distortion and unnatural pitch rigidity.",
                exact_evidence_phrase="Acoustic vocoder residue detected"
            ))

        return attributions
