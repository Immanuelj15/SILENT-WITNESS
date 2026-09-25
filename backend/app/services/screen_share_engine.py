"""
Screen-Sharing & Remote Access Scam Detection Subsystem.

Section 9, 21, and 23:
Monitors dialogue turns and event streams for high-risk screen-sharing solicitations,
remote access tool installations (AnyDesk, TeamViewer, QuickSupport, RustDesk),
and dangerous requests to open banking apps or expose OTPs/PINs during screen sharing.
"""

from typing import Dict, List, Any, Optional
import re


SCREEN_SHARE_KEYWORDS = [
    r"\b(share screen|share your screen|start sharing|turn on screen share|screen share pannunga)\b",
    r"\b(open banking app|open your bank app|open yono|open google pay|open phonepe|open paytm)\b",
    r"\b(show me the otp|show your sms|read the code on screen|show your pin|show transaction)\b",
    r"\b(anydesk|quicksupport|teamviewer|rustdesk|screen share app|remote support)\b",
    r"\b(install apk|download apk|enable accessibility|grant permission|device admin)\b",
    r"\b(whatsapp video call|switch to video|show camera|turn on video)\b"
]


class ScreenShareRiskEngine:
    def __init__(self):
        self.compiled_patterns = [re.compile(p, re.IGNORECASE) for p in SCREEN_SHARE_KEYWORDS]

    def analyze_text(self, text: str, call_sequence: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Analyzes conversation text for screen-sharing and remote takeover coercion.
        """
        if not text:
            return {
                "screen_share_risk": 0,
                "detected": False,
                "risk_level": "LOW",
                "matched_patterns": [],
                "target_assets_at_risk": [],
                "recommended_action": "Safe to continue."
            }

        text_lower = text.lower()
        matched_patterns = []
        for pat in self.compiled_patterns:
            matches = pat.findall(text_lower)
            if matches:
                matched_patterns.extend([m if isinstance(m, str) else m[0] for m in matches])

        # Identify specific high-risk exposure targets
        assets_at_risk = []
        if any(w in text_lower for w in ["bank", "yono", "google pay", "phonepe", "paytm", "account"]):
            assets_at_risk.append("BANKING_CREDENTIALS")
        if any(w in text_lower for w in ["otp", "sms", "pin", "code", "password"]):
            assets_at_risk.append("AUTHENTICATION_OTPS")
        if any(w in text_lower for w in ["anydesk", "teamviewer", "quicksupport", "rustdesk", "remote"]):
            assets_at_risk.append("COMPLETE_DEVICE_CONTROL")
        if any(w in text_lower for w in ["apk", "accessibility", "permission"]):
            assets_at_risk.append("MALICIOUS_APP_TAKEOVER")

        # Determine risk level and score
        risk_score = 0
        if "COMPLETE_DEVICE_CONTROL" in assets_at_risk or "MALICIOUS_APP_TAKEOVER" in assets_at_risk:
            risk_score = 95
        elif len(matched_patterns) >= 2 or ("BANKING_CREDENTIALS" in assets_at_risk and "AUTHENTICATION_OTPS" in assets_at_risk):
            risk_score = 90
        elif len(matched_patterns) == 1:
            risk_score = 65

        is_detected = risk_score >= 60

        warning_message = None
        if is_detected:
            warning_message = (
                "🚨 STOP — CRITICAL SCREEN SHARING RISK DETECTED!\n"
                "The caller is asking you to share your screen or install remote access software.\n"
                "This will instantly expose your OTPs, banking apps, and passwords to the attacker."
            )

        return {
            "screen_share_risk": risk_score,
            "detected": is_detected,
            "risk_level": "CRITICAL" if risk_score >= 85 else "HIGH" if risk_score >= 60 else "LOW",
            "matched_patterns": list(set(matched_patterns)),
            "target_assets_at_risk": assets_at_risk,
            "warning": warning_message,
            "recommended_action": (
                "STOP SCREEN SHARING IMMEDIATELY. NEVER OPEN BANKING APPS DURING A CALL."
                if is_detected else "No screen-sharing coercion observed."
            )
        }


screen_share_engine = ScreenShareRiskEngine()
