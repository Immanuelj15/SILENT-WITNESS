"""
Conversation Attack Timeline Engine
Constructs an explainable, chronological attack timeline of live conversation events.
Each event includes:
  - timestamp (seconds & mm:ss)
  - eventType
  - evidence
  - riskContribution (+ points)
  - confidence
  - intent
  - whyThisMatters
"""

from typing import List, Dict, Any, Optional

def format_timestamp(seconds: float) -> str:
    m = int(seconds) // 60
    s = int(seconds) % 60
    return f"{m:02d}:{s:02d}"

class AttackTimelineEngine:
    def __init__(self):
        pass

    def build_timeline(
        self,
        transcript: str,
        dialogue_turns: Optional[List[Dict[str, Any]]] = None,
        evidence_items: Optional[List[Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Builds chronological attack timeline items.
        """
        timeline_events: List[Dict[str, Any]] = []

        # Rules catalog for timeline generation
        event_patterns = [
            {
                "type": "IDENTITY_CLAIM",
                "label": "Caller Identity Claim",
                "keywords": ["calling from", "i am from", "speaking from", "department of", "police department", "support desk", "helpdesk"],
                "risk_contribution": 10,
                "confidence": 0.90,
                "intent": "Impersonation / Persona Establishment",
                "why_this_matters": "Fraudsters establish false authority early to gain victim trust."
            },
            {
                "type": "ACCOUNT_PROBLEM",
                "label": "Problem / Anomaly Introduced",
                "keywords": ["suspicious activity", "unauthorized transaction", "card compromise", "unusual login", "account problem", "parcel seized", "drugs found"],
                "risk_contribution": 15,
                "confidence": 0.88,
                "intent": "Pretext Creation",
                "why_this_matters": "Creates confusion and primes the victim to seek an immediate solution."
            },
            {
                "type": "URGENCY",
                "label": "Artificial Urgency Detected",
                "keywords": ["immediately", "within 10 minutes", "right now", "expire today", "urgent", "don't delay", "immediate-ah", "turant"],
                "risk_contribution": 20,
                "confidence": 0.94,
                "intent": "Cognitive Overload / Panic Inducement",
                "why_this_matters": "Urgency forces fast emotional reactions and impairs critical reasoning."
            },
            {
                "type": "THREAT",
                "label": "Punitive Threat / Coercion",
                "keywords": ["account will be blocked", "arrest warrant", "digital arrest", "police action", "court summons", "penalties", "frozen", "block aagidum"],
                "risk_contribution": 25,
                "confidence": 0.95,
                "intent": "Intimidation & Extortion",
                "why_this_matters": "Fear of legal or financial penalty induces victims to surrender control."
            },
            {
                "type": "OTP_REQUEST",
                "label": "OTP / Credential Solicitation",
                "keywords": ["otp", "one time password", "six-digit", "pin number", "cvv", "password", "netbanking credentials"],
                "risk_contribution": 35,
                "confidence": 0.99,
                "intent": "Credential Harvesting",
                "why_this_matters": "Legitimate organizations NEVER ask for OTPs or PINs over phone calls."
            },
            {
                "type": "PAYMENT_REQUEST",
                "label": "Payment or Transfer Demand",
                "keywords": ["transfer money", "send money", "upi payment", "deposit", "verification fee", "clearing fee", "scan the qr", "pay rupees", "safe account"],
                "risk_contribution": 30,
                "confidence": 0.96,
                "intent": "Direct Financial Theft",
                "why_this_matters": "Demanding transfers into third-party or 'safe reserve' accounts is signature fraud."
            },
            {
                "type": "REMOTE_ACCESS",
                "label": "Remote Access Tool Request",
                "keywords": ["anydesk", "teamviewer", "rustdesk", "quicksupport", "install the app", "share screen", "download apk"],
                "risk_contribution": 35,
                "confidence": 0.97,
                "intent": "Device Takeover",
                "why_this_matters": "Remote desktop apps allow the scammer to manipulate phone apps and intercept 2FA codes."
            },
            {
                "type": "ISOLATION",
                "label": "Secrecy & Call Isolation",
                "keywords": ["do not disconnect", "stay on this call", "don't tell anyone", "confidential line", "don't share with family"],
                "risk_contribution": 20,
                "confidence": 0.92,
                "intent": "Preventing Third-Party Intervention",
                "why_this_matters": "Scammers isolate victims so family or bank staff cannot intervene to stop fraud."
            }
        ]

        text_lower = transcript.lower()

        # Step 1: Scan dialogue turns if available
        matched_types = set()
        if dialogue_turns:
            for turn in dialogue_turns:
                t_text = turn.get("text", "")
                t_lower = t_text.lower()
                speaker = turn.get("speaker", "CALLER")
                if speaker in ["CALLER", "UNKNOWN"]:
                    for pat in event_patterns:
                        if pat["type"] not in matched_types:
                            for kw in pat["keywords"]:
                                if kw.lower() in t_lower:
                                    matched_types.add(pat["type"])
                                    t_sec = float(turn.get("timestamp_sec", 0))
                                    timeline_events.append({
                                        "timestamp": t_sec,
                                        "timeFormatted": format_timestamp(t_sec),
                                        "eventType": pat["type"],
                                        "label": pat["label"],
                                        "evidence": t_text.strip(),
                                        "riskContribution": f"+{pat['risk_contribution']}",
                                        "riskDelta": pat["risk_contribution"],
                                        "confidence": pat["confidence"],
                                        "intent": pat["intent"],
                                        "whyThisMatters": pat["why_this_matters"],
                                        "speaker": speaker
                                    })
                                    break

        # Step 2: Fallback on transcript regex for any unmatched patterns
        for pat in event_patterns:
            if pat["type"] not in matched_types:
                for kw in pat["keywords"]:
                    idx = text_lower.find(kw.lower())
                    if idx != -1:
                        matched_types.add(pat["type"])
                        start = max(0, text_lower.rfind(".", 0, idx) + 1)
                        end = text_lower.find(".", idx)
                        if end == -1:
                            end = len(transcript)
                        snippet = transcript[start:end].strip() or kw
                        approx_time = max(5, int((idx / max(len(text_lower), 1)) * 90))
                        timeline_events.append({
                            "timestamp": approx_time,
                            "timeFormatted": format_timestamp(approx_time),
                            "eventType": pat["type"],
                            "label": pat["label"],
                            "evidence": snippet,
                            "riskContribution": f"+{pat['risk_contribution']}",
                            "riskDelta": pat["risk_contribution"],
                            "confidence": pat["confidence"],
                            "intent": pat["intent"],
                            "whyThisMatters": pat["why_this_matters"],
                            "speaker": "CALLER"
                        })
                        break

        # Sort timeline chronologically
        timeline_events.sort(key=lambda x: x["timestamp"])
        return timeline_events

timeline_engine = AttackTimelineEngine()
