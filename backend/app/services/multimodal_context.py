"""
Multi-Modal SMS & Email Phishing Prior Correlation Subsystem (Tier 3 Architecture).

Correlates incoming phone call claims with suspicious SMS or email lures received
shortly prior to the conversation (with user opt-in consent).
"""

from typing import Dict, List, Any, Optional
import re
import time


class MultiModalContextEngine:
    def __init__(self):
        # High-risk phishing lure templates found in SMS
        self.sms_lure_indicators = [
            r"\b(yono|sbi|hdfc|icici|axis|pnb|bank)\b",
            r"\b(blocked|suspended|deactivated|expire|freeze|stopped)\b",
            r"\b(pan card|aadhaar|kyc|update|verify|click|link|http|bit\.ly|apk)\b",
            r"\b(electricity|bill|power cut|disconnection|officer)\b",
            r"\b(lottery|winner|kbc|cash prize|reward|bonus)\b",
            r"\b(fedex|customs|parcel|dhl|consignment|courier)\b"
        ]

    def correlate_sms_with_call(
        self,
        recent_messages: List[Dict[str, Any]],
        call_transcript: str
    ) -> Dict[str, Any]:
        """
        Cross-references recent SMS inbox lures with the live spoken transcript.
        recent_messages: [{"sender": str, "body": str, "timestamp": float}]
        call_transcript: Spoken text accumulated so far.
        """
        if not recent_messages or not call_transcript:
            return {
                "correlated": False,
                "correlation_score": 0.0,
                "matched_lure": None,
                "risk_elevation": 0,
                "evidence": []
            }

        transcript_lower = call_transcript.lower()
        best_match = None
        highest_overlap = 0

        for msg in recent_messages:
            body = msg.get("body", "").lower()
            sender = msg.get("sender", "")

            # Check if SMS matches known phishing patterns
            lure_matches = [p for p in self.sms_lure_indicators if re.search(p, body)]
            if not lure_matches:
                continue

            # Check keyword overlap between SMS body and Spoken Call (support 3+ letter acronyms like sbi, pan, otp, kyc)
            sms_tokens = set(re.findall(r"\b[a-zA-Z]{3,}\b", body))
            overlap_tokens = [t for t in sms_tokens if t in transcript_lower]

            if len(overlap_tokens) >= 2:
                overlap_score = len(overlap_tokens) / max(len(sms_tokens), 1)
                if len(overlap_tokens) > highest_overlap:
                    highest_overlap = len(overlap_tokens)
                    best_match = {
                        "sender": sender,
                        "sms_snippet": msg.get("body", "")[:120],
                        "shared_entities": overlap_tokens,
                        "timestamp": msg.get("timestamp", time.time())
                    }

        if best_match and highest_overlap >= 2:
            return {
                "correlated": True,
                "correlation_score": min(1.0, round(0.5 + (highest_overlap * 0.1), 2)),
                "matched_lure": best_match,
                "risk_elevation": 25,
                "evidence": [
                    f"Spoken dialogue directly corroborates suspicious SMS lure from '{best_match['sender']}': {best_match['sms_snippet']}"
                ],
                "explanation": "Multi-modal correlation: Caller is verbally executing the attack lure primed via recent SMS message."
            }

        return {
            "correlated": False,
            "correlation_score": 0.0,
            "matched_lure": None,
            "risk_elevation": 0,
            "evidence": []
        }


multimodal_engine = MultiModalContextEngine()
