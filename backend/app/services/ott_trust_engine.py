"""
OTT Trust Score Fusion Engine — WhatsApp/Telegram/VoIP Edition.

Fuses OTT-specific risk signals with OTT-weighted scoring:
  - Screen-share + financial context → INSTANT fast-path critical override (no gradual decay)
  - Video extortion pattern → INSTANT fast-path critical override
  - App-layer identity risks (unsaved, new account, call origin)
  - Chat-context link/file risks
  - Voice authenticity (weighted lower for group/broadcast origins)
  - Conversational NLP risk from the base system

Design axiom: Screen-share fraud and video blackmail cause irreversible harm in seconds.
Fast-path overrides react to these BEFORE the gradual weighted score can act.
"""

from typing import Dict, Any, Optional, List
import re

# OTT-Specific weight table (differs from SIM call weights)
OTT_WEIGHTS = {
    "screen_share_risk": 0.30,      # Highest weight — OTT screen-share fraud is primary harm vector
    "video_extortion_risk": 0.25,   # Second highest — irreversible in seconds
    "ott_identity_risk": 0.15,      # App-layer identity signals
    "nlp_intent_risk": 0.15,        # Conversational patterns
    "link_file_risk": 0.10,         # Chat-context phishing links/APKs
    "voice_authenticity_risk": 0.05,  # Lower weight for OTT (VoIP degrades quality legitimately)
}

# Fast-path override thresholds
FAST_PATH_OVERRIDE_RULES = [
    {
        "name": "screen_share_financial_override",
        "description": "Screen sharing active or coerced + financial/credential context",
        "min_risk_floor": 92,
        "triggers": ["screen_share_active", "screen_share_coercion_detected"],
        "context_required": ["financial_context_detected"],
        "label": "🚨 CRITICAL: Screen-share + financial context — STOP SHARING NOW",
        "action": "STOP_SCREEN_SHARE_AND_END_CALL",
    },
    {
        "name": "video_extortion_override",
        "description": "Video extortion/blackmail pattern from unknown caller",
        "min_risk_floor": 90,
        "triggers": ["video_extortion_pattern", "inappropriate_content_detected"],
        "context_required": [],
        "label": "🚨 CRITICAL: Video blackmail setup detected — END CALL IMMEDIATELY",
        "action": "END_CALL_AND_BLOCK",
    },
    {
        "name": "otp_under_screen_share",
        "description": "OTP or PIN solicitation during active screen sharing",
        "min_risk_floor": 95,
        "triggers": ["otp_solicited", "pin_requested", "credential_requested"],
        "context_required": ["screen_share_active"],
        "label": "🚨 CRITICAL: OTP/credential demand while screen is shared — STOP",
        "action": "STOP_SCREEN_SHARE_AND_END_CALL",
    },
    {
        "name": "remote_takeover_apk",
        "description": "Request to install AnyDesk/TeamViewer/APK during OTT call",
        "min_risk_floor": 88,
        "triggers": ["remote_access_tool_requested", "apk_download_requested"],
        "context_required": [],
        "label": "🚨 HIGH RISK: Remote device takeover attempt detected",
        "action": "REFUSE_AND_END_CALL",
    },
]

# Keywords that indicate financial/credential context in conversation
FINANCIAL_CONTEXT_PATTERNS = [
    r"\b(otp|pin|password|cvv|card number|account number|bank|upi|wallet|payment)\b",
    r"\b(transfer|send money|pay|transaction|atm|debit card|credit card)\b",
    r"\b(yono|google pay|phonepe|paytm|neft|rtgs|imps|bhim)\b",
    r"\b(kyc|aadhaar|pan card|verify|verification|update your)\b",
]

# OTT-specific scam phrase patterns
OTT_SCAM_PHRASES = [
    r"\b(this call (is|will be) encrypted|whatsapp calls (are|aren'?t) traceable|telegram is secure)\b",
    r"\b(screen share|share (your )?screen|tap share icon|enable screen sharing)\b",
    r"\b(install (this |the )?(apk|app)|download anydesk|download teamviewer|quicksupport)\b",
    r"\b(click the link (i|we) sent|open the link (in|from) (my|our) message)\b",
    r"\b(call (won'?t|will not) be traced|no one (can|will) know about this call)\b",
    r"\b(i am (from|calling from) (your|the) bank|bank (security|fraud|prevention))\b",
    r"\b(new job offer|work from home|earn (per|an hour|daily)|telegram task)\b",
    r"\b(turn on (your )?video|show (your )?face|i need to see you)\b",
]


class OTTTrustFusionEngine:
    """
    Fuses OTT-specific signals into a Trust Score with fast-path overrides
    for screen-share and video extortion scenarios.
    """

    def __init__(self):
        self.financial_patterns = [
            re.compile(p, re.IGNORECASE) for p in FINANCIAL_CONTEXT_PATTERNS
        ]
        self.ott_scam_patterns = [
            re.compile(p, re.IGNORECASE) for p in OTT_SCAM_PHRASES
        ]

    def detect_financial_context(self, transcript: str) -> bool:
        """Returns True if the transcript contains financial/credential context."""
        for pat in self.financial_patterns:
            if pat.search(transcript):
                return True
        return False

    def detect_ott_scam_signals(self, transcript: str) -> List[str]:
        """Returns list of matched OTT-specific scam phrase indicators."""
        matched = []
        for pat in self.ott_scam_patterns:
            m = pat.search(transcript)
            if m:
                matched.append(m.group(0))
        return matched

    def check_fast_path_overrides(
        self,
        transcript: str,
        screen_share_active: bool = False,
        screen_share_coercion_detected: bool = False,
        video_extortion_pattern: bool = False,
        inappropriate_content_detected: bool = False,
        otp_solicited: bool = False,
        remote_access_tool_requested: bool = False,
        apk_download_requested: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """
        Checks all fast-path override rules.
        Returns the first matching override dict, or None if no fast-path applies.
        Fast-path overrides BYPASS gradual score decay — they fire instantly.
        """
        financial_context = self.detect_financial_context(transcript)

        active_triggers = set()
        if screen_share_active:
            active_triggers.add("screen_share_active")
        if screen_share_coercion_detected:
            active_triggers.add("screen_share_coercion_detected")
        if video_extortion_pattern:
            active_triggers.add("video_extortion_pattern")
        if inappropriate_content_detected:
            active_triggers.add("inappropriate_content_detected")
        if otp_solicited:
            active_triggers.add("otp_solicited")
            active_triggers.add("credential_requested")
        if remote_access_tool_requested:
            active_triggers.add("remote_access_tool_requested")
        if apk_download_requested:
            active_triggers.add("apk_download_requested")
        if financial_context:
            active_triggers.add("financial_context_detected")

        # Check each rule in order of severity
        for rule in FAST_PATH_OVERRIDE_RULES:
            rule_triggers = set(rule["triggers"])
            context_required = set(rule.get("context_required", []))

            trigger_hit = bool(rule_triggers & active_triggers)
            context_hit = not context_required or bool(context_required & active_triggers)

            if trigger_hit and context_hit:
                return {
                    "fast_path_triggered": True,
                    "rule_name": rule["name"],
                    "description": rule["description"],
                    "risk_floor": rule["min_risk_floor"],
                    "trust_ceiling": 100 - rule["min_risk_floor"],
                    "label": rule["label"],
                    "recommended_action": rule["action"],
                    "active_triggers": list(active_triggers & rule_triggers),
                    "context_matched": list(active_triggers & context_required),
                }

        return None

    def compute_ott_trust_score(
        self,
        transcript: str,
        base_nlp_risk: float = 0.0,
        voice_risk: float = 0.0,
        screen_share_risk: float = 0.0,
        video_extortion_risk: float = 0.0,
        ott_identity_risk: float = 0.0,
        link_file_risk: float = 0.0,
        screen_share_active: bool = False,
        screen_share_coercion_detected: bool = False,
        video_extortion_pattern: bool = False,
        inappropriate_content_detected: bool = False,
        otp_solicited: bool = False,
        remote_access_tool_requested: bool = False,
        apk_download_requested: bool = False,
        call_origin: str = "DIRECT_DIAL",
    ) -> Dict[str, Any]:
        """
        Main fusion method. Checks fast-path first, then computes weighted score.
        """

        # Step 1: Check fast-path overrides FIRST (always before gradual scoring)
        override = self.check_fast_path_overrides(
            transcript=transcript,
            screen_share_active=screen_share_active,
            screen_share_coercion_detected=screen_share_coercion_detected,
            video_extortion_pattern=video_extortion_pattern,
            inappropriate_content_detected=inappropriate_content_detected,
            otp_solicited=otp_solicited,
            remote_access_tool_requested=remote_access_tool_requested,
            apk_download_requested=apk_download_requested,
        )

        # Detect OTT-specific scam signals in transcript
        ott_signals = self.detect_ott_scam_signals(transcript)
        ott_signal_bonus = min(len(ott_signals) * 8.0, 30.0)

        # Step 2: Weighted score computation (OTT-adjusted weights)
        # Voice weight is halved for broadcast/group-origin calls (VoIP degradation ≠ synthetic)
        voice_weight = OTT_WEIGHTS["voice_authenticity_risk"]
        if call_origin in ("BROADCAST", "GROUP_ADD", "FORWARDED_LINK"):
            voice_weight *= 0.5  # Halve voice deepfake weight for impersonal origin calls

        weighted_risk = (
            screen_share_risk * OTT_WEIGHTS["screen_share_risk"]
            + video_extortion_risk * OTT_WEIGHTS["video_extortion_risk"]
            + ott_identity_risk * OTT_WEIGHTS["ott_identity_risk"]
            + base_nlp_risk * OTT_WEIGHTS["nlp_intent_risk"]
            + link_file_risk * OTT_WEIGHTS["link_file_risk"]
            + voice_risk * voice_weight
            + ott_signal_bonus
        )

        weighted_risk = min(100.0, weighted_risk)

        # Step 3: Apply fast-path floor if override triggered
        if override:
            final_risk = max(weighted_risk, float(override["risk_floor"]))
            fast_path_triggered = True
        else:
            final_risk = weighted_risk
            fast_path_triggered = False

        final_risk = round(min(100.0, max(0.0, final_risk)))
        trust_score = 100 - final_risk

        # Step 4: Classification
        if final_risk >= 80:
            classification = "CRITICAL"
            severity_label = "CRITICAL RISK — IMMEDIATE ACTION REQUIRED"
        elif final_risk >= 60:
            classification = "HIGH_RISK"
            severity_label = "HIGH RISK — DO NOT SHARE CREDENTIALS"
        elif final_risk >= 40:
            classification = "SUSPICIOUS"
            severity_label = "SUSPICIOUS — VERIFY CALLER IDENTITY"
        elif final_risk >= 20:
            classification = "GUARDED"
            severity_label = "GUARDED — PROCEED WITH CAUTION"
        else:
            classification = "SAFE"
            severity_label = "APPEARS SAFE"

        # Step 5: Build attribution breakdown
        attribution = {
            "screen_share_contribution": round(screen_share_risk * OTT_WEIGHTS["screen_share_risk"], 1),
            "video_extortion_contribution": round(video_extortion_risk * OTT_WEIGHTS["video_extortion_risk"], 1),
            "identity_contribution": round(ott_identity_risk * OTT_WEIGHTS["ott_identity_risk"], 1),
            "nlp_contribution": round(base_nlp_risk * OTT_WEIGHTS["nlp_intent_risk"], 1),
            "link_file_contribution": round(link_file_risk * OTT_WEIGHTS["link_file_risk"], 1),
            "voice_contribution": round(voice_risk * voice_weight, 1),
            "ott_phrase_bonus": round(ott_signal_bonus, 1),
        }

        return {
            "ott_risk_score": final_risk,
            "ott_trust_score": trust_score,
            "classification": classification,
            "severity_label": severity_label,
            "fast_path_triggered": fast_path_triggered,
            "fast_path_override": override,
            "attribution": attribution,
            "ott_signals_detected": ott_signals,
            "financial_context_detected": self.detect_financial_context(transcript),
            "weights_used": OTT_WEIGHTS,
        }


ott_trust_engine = OTTTrustFusionEngine()
