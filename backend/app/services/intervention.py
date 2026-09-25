"""
Active Intervention Engine
Evaluates live risk / trust scores and triggers graduated safety interventions.
Provides 4-level escalation, actionable recommendations, and explicit user-confirmation
gates for high-impact interventions (e.g. trusted contact alerts, call termination).
"""

from typing import Dict, Any, List, Optional
from datetime import datetime

class ActiveInterventionEngine:
    def __init__(self):
        # Tracking active confirmation requests
        self._pending_confirmations: Dict[str, Dict[str, Any]] = {}

    def evaluate_intervention(
        self,
        trust_score: int,
        risk_score: int,
        primary_signals: List[str],
        evidence_items: Optional[List[Any]] = None,
        identity_verified: bool = False
    ) -> Dict[str, Any]:
        """
        Calculates active intervention state and required defensive UI actions.
        Trust > 70: Normal Monitoring
        Trust 50-70: Level 1 (Caution)
        Trust 30-50: Level 2 (High Risk)
        Trust 15-30: Level 3 (Possible Scam)
        Trust < 15: Level 4 (STOP AND VERIFY / CRITICAL)
        """
        # Determine escalation level
        if trust_score > 70:
            level = 0
            tier_name = "MONITORING"
            headline = "Normal Monitoring"
            message = "Conversation shows low risk. Continue normally."
            actions = ["SHOW_SAFE_STATUS"]
            requires_user_confirmation = False
            safe_recommendations = ["Continue normally", "Verify details if unusual"]
            audio_alert = None

        elif trust_score > 50:
            level = 1
            tier_name = "CAUTION"
            headline = "⚠ Be Careful"
            message = "This caller is creating urgency or requesting unverified details."
            actions = ["SHOW_WARNING", "HIGHLIGHT_TRANSCRIPT"]
            requires_user_confirmation = False
            safe_recommendations = [
                "Ask caller for their official reference number",
                "Do not agree to rush into any decision"
            ]
            audio_alert = "caution_chime.wav"

        elif trust_score > 30:
            level = 2
            tier_name = "HIGH_ALERT"
            headline = "⚠ High Risk Warning"
            message = "The caller is requesting sensitive credentials or personal details."
            actions = ["SHOW_WARNING", "HIGHLIGHT_TRANSCRIPT", "SHOW_SAFE_ACTION", "ENABLE_EASY_MODE"]
            requires_user_confirmation = False
            safe_recommendations = [
                "Do NOT share passwords, OTPs, or debit card PINs",
                "Do NOT install any screen sharing or remote management apps"
            ]
            audio_alert = "warning_beep.wav"

        elif trust_score >= 15:
            level = 3
            tier_name = "POSSIBLE_SCAM"
            headline = "🚨 Possible Scam Detected"
            message = "Critical scam signals detected. High probability of social engineering or credential harvesting."
            actions = [
                "SHOW_WARNING",
                "PLAY_ALERT",
                "HIGHLIGHT_TRANSCRIPT",
                "SHOW_SAFE_ACTION",
                "ENABLE_EASY_MODE",
                "REQUEST_USER_CONFIRMATION",
                "END_CALL_RECOMMENDATION"
            ]
            requires_user_confirmation = True
            safe_recommendations = [
                "DO NOT SHARE YOUR OTP, PIN, OR PASSWORD",
                "Do NOT transfer any money or scan QR codes",
                "Hang up and dial the official bank helpline directly"
            ]
            audio_alert = "scam_alert_siren.wav"

        else:
            level = 4
            tier_name = "CRITICAL"
            headline = "🚨 STOP AND VERIFY"
            message = "EXTREME FRAUD HAZARD: Coercive fraud pattern detected. Immediately disconnect."
            actions = [
                "SHOW_WARNING",
                "PLAY_ALERT",
                "HIGHLIGHT_TRANSCRIPT",
                "SHOW_SAFE_ACTION",
                "ENABLE_EASY_MODE",
                "REQUEST_USER_CONFIRMATION",
                "TRIGGER_TRUSTED_CONTACT_ALERT",
                "END_CALL_RECOMMENDATION"
            ]
            requires_user_confirmation = True
            safe_recommendations = [
                "END THIS CALL IMMEDIATELY",
                "Do not answer callback from this number",
                "Contact your bank fraud desk directly through official website"
            ]
            audio_alert = "critical_hazard_alarm.wav"

        high_impact_actions = []
        if "TRIGGER_TRUSTED_CONTACT_ALERT" in actions:
            high_impact_actions.append({
                "action": "TRIGGER_TRUSTED_CONTACT_ALERT",
                "description": "Send emergency SMS warning to pre-registered family contact",
                "requires_confirmation": True
            })
        if "END_CALL_RECOMMENDATION" in actions:
            high_impact_actions.append({
                "action": "END_CALL_RECOMMENDATION",
                "description": "Recommend immediate call hangup",
                "requires_confirmation": False
            })

        return {
            "level": level,
            "tier": tier_name,
            "headline": headline,
            "message": message,
            "actions": actions,
            "safeRecommendations": safe_recommendations,
            "requiresUserConfirmation": requires_user_confirmation,
            "highImpactActions": high_impact_actions,
            "audioAlert": audio_alert,
            "trustScore": trust_score,
            "riskScore": risk_score,
            "timestamp": datetime.utcnow().isoformat()
        }

    def register_confirmation_request(self, call_id: str, action: str) -> str:
        confirmation_id = f"CONF-{call_id[:6]}-{action[:4].upper()}"
        self._pending_confirmations[confirmation_id] = {
            "call_id": call_id,
            "action": action,
            "status": "PENDING",
            "created_at": datetime.utcnow().isoformat()
        }
        return confirmation_id

    def resolve_confirmation(self, confirmation_id: str, approved: bool) -> Dict[str, Any]:
        if confirmation_id in self._pending_confirmations:
            record = self._pending_confirmations[confirmation_id]
            record["status"] = "APPROVED" if approved else "REJECTED"
            record["resolved_at"] = datetime.utcnow().isoformat()
            return {
                "success": True,
                "confirmationId": confirmation_id,
                "status": record["status"],
                "action": record["action"]
            }
        return {
            "success": False,
            "message": "Confirmation ID not found or already expired"
        }

intervention_engine = ActiveInterventionEngine()
