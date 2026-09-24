import re
from typing import Dict, Any, List

class IntentAgent:
    """
    Intent Agent: Evaluates actionable caller requests.
    Determines: "What is the caller trying to compel the listener to do?"
    Distinguishes legitimate mentions (e.g., 'I sent money') from active demands ('give me your OTP').
    """

    # Active demands targeting sensitive credentials
    CREDENTIAL_DEMANDS = [
        (r"\b(tell|give|share|send|read( out)?|provide)\b.*\b(otp|one time password|verification code)\b", "OTP Solicitation", 95.0),
        (r"\b(enter|share|tell)\b.*\b(upi pin|atm pin|secret pin|mpin)\b", "PIN Solicitation", 95.0),
        (r"\b(share|tell|give)\b.*\b(password|cvv|card number|expiry date)\b", "Card/Password Solicitation", 90.0),
    ]

    # Active demands targeting money transfer or remote control app installation
    ACTION_DEMANDS = [
        (r"\b(transfer|send|pay)\b.*\b(money|amount|rupees|rs\.?|\$|cash|fund)\b", "Direct Money Transfer Request", 75.0),
        (r"\b(download|install)\b.*\b(anydesk|teamviewer|quicksupport|rustdesk|apk|app)\b", "Remote Access Tool Demand", 90.0),
        (r"\b(click|open)\b.*\b(link|sms link|url|website)\b", "Malicious Link Direction", 65.0),
    ]

    # Benign context indicators (e.g. user telling someone they received money, or talking about normal routine)
    BENIGN_CONTEXTS = [
        r"\b(my friend sent me money|i received money|i got payment|thank you for the transfer)\b",
        r"\b(i will visit the branch|i will go to the bank|i am at the bank)\b",
        r"\b(delivery person called|when will parcel arrive)\b",
    ]

    def analyze(self, transcript: str) -> Dict[str, Any]:
        if not transcript or len(transcript.strip()) < 3:
            return {
                "fraud_intent_score": 0.0,
                "confidence": 0.5,
                "demands": [],
                "proposed_evidence": []
            }

        norm_text = transcript.lower()
        demands = []
        proposed_evidence = []
        max_severity = 0.0

        # Check for benign context override
        is_benign_statement = any(re.search(b_pat, norm_text) for b_pat in self.BENIGN_CONTEXTS)

        # Check credential demands
        for pat, desc, score in self.CREDENTIAL_DEMANDS:
            match = re.search(pat, norm_text)
            if match:
                demands.append(desc)
                max_severity = max(max_severity, score)
                proposed_evidence.append({
                    "phrase": match.group(0),
                    "tag": "Credential Demand",
                    "note": f"Critical risk demand: {desc}"
                })

        # Check action demands
        for pat, desc, score in self.ACTION_DEMANDS:
            match = re.search(pat, norm_text)
            if match:
                demands.append(desc)
                max_severity = max(max_severity, score)
                proposed_evidence.append({
                    "phrase": match.group(0),
                    "tag": "Action Demand",
                    "note": f"Suspicious action demanded: {desc}"
                })

        # Context reduction if clearly benign conversational narrative
        if is_benign_statement and len(demands) == 0:
            max_severity = 0.0

        confidence = 0.94 if len(demands) > 0 else 0.75

        return {
            "fraud_intent_score": round(max_severity, 1),
            "confidence": confidence,
            "demands": list(set(demands)),
            "proposed_evidence": proposed_evidence
        }
