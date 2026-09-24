import re
from typing import Dict, Any, List

class ScamAgent:
    """
    Scam Agent: Analyzes conversation for known fraud tactics, social engineering,
    urgency, intimidation, and pressure patterns.
    """

    # Indicators of urgency & pressure
    URGENCY_PATTERNS = [
        (r"\b(immediately|right now|within (\d+|few) (minutes|hours)|urgently|at once)\b", "Urgency"),
        (r"\b(account will be (blocked|suspended|frozen|closed|terminated))\b", "Account Suspension Threat"),
        (r"\b(today itself|last chance|offer expires|police will be sent)\b", "Severe Pressure / Deadline"),
    ]

    # Threats and intimidation
    THREAT_PATTERNS = [
        (r"\b(police|cbi|arrest|warrant|court|legal action|customs case|fir)\b", "Legal/Law Enforcement Threat"),
        (r"\b(penalty|fine of \d+|confiscated|drug parcel|digital arrest)\b", "Imprisonment / Seizure Threat"),
    ]

    # Indian scam specific patterns
    INDIAN_TACTICS = [
        (r"\b(electricity bill unpaid|power will be disconnected)\b", "Electricity Disconnection Threat"),
        (r"\b(like youtube video|telegram task|daily income)\b", "Part-Time Task Scam"),
        (r"\b(lottery won|kbc prize|lucky draw prize)\b", "Prize / Lottery Hook"),
        (r"\b(scan qr code to receive|enter upi pin to get)\b", "UPI Inversion Fraud"),
    ]

    def analyze(self, transcript: str) -> Dict[str, Any]:
        if not transcript or len(transcript.strip()) < 3:
            return {
                "scam_risk": 0.0,
                "confidence": 0.5,
                "detected_tactics": [],
                "proposed_evidence": [],
                "social_engineering_score": 0.0,
                "threat_score": 0.0
            }

        norm_text = transcript.lower()
        detected_tactics = []
        proposed_evidence = []
        urgency_hits = 0
        threat_hits = 0

        # Check urgency
        for pat, desc in self.URGENCY_PATTERNS:
            matches = list(re.finditer(pat, norm_text))
            for m in matches:
                urgency_hits += 1
                detected_tactics.append(desc)
                proposed_evidence.append({
                    "phrase": m.group(0),
                    "tag": "Urgency",
                    "note": f"Pressure tactic detected: {desc}"
                })

        # Check threats
        for pat, desc in self.THREAT_PATTERNS:
            matches = list(re.finditer(pat, norm_text))
            for m in matches:
                threat_hits += 1
                detected_tactics.append(desc)
                proposed_evidence.append({
                    "phrase": m.group(0),
                    "tag": "Threat",
                    "note": f"Intimidation detected: {desc}"
                })

        # Check specific tactics
        for pat, desc in self.INDIAN_TACTICS:
            matches = list(re.finditer(pat, norm_text))
            for m in matches:
                detected_tactics.append(desc)
                proposed_evidence.append({
                    "phrase": m.group(0),
                    "tag": "Scam Pattern",
                    "note": f"Recognized fraud pattern: {desc}"
                })

        # Contextual scoring: False-positive mitigation
        # E.g. "I am going to the bank to update my KYC" has no urgency/threat from the other speaker
        se_score = min(100.0, (urgency_hits * 35.0) + (len(detected_tactics) * 15.0))
        threat_score = min(100.0, threat_hits * 45.0)
        overall_scam_risk = min(100.0, (se_score * 0.6) + (threat_score * 0.4))

        # Confidence is higher when evidence is clearly present or transcript is substantial
        confidence = 0.88 if len(detected_tactics) > 0 else 0.70

        return {
            "scam_risk": round(overall_scam_risk, 1),
            "confidence": confidence,
            "detected_tactics": list(set(detected_tactics)),
            "proposed_evidence": proposed_evidence,
            "social_engineering_score": round(se_score, 1),
            "threat_score": round(threat_score, 1)
        }
