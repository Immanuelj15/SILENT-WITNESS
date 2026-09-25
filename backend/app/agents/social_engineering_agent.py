import re
from typing import Dict, Any, List
from pydantic import BaseModel

class SocialEngineeringSignal(BaseModel):
    vector: str  # "URGENCY", "AUTHORITY", "FEAR", "THREAT", "REWARD", "SCARCITY", "IMPERSONATION", "EMOTIONAL_MANIPULATION", "ISOLATION", "SECRECY", "PRESSURE", "TIME_LIMITATION"
    severity: str
    evidence_text: str
    confidence: float

class SocialEngineeringAgent:
    """
    Dedicated Social Engineering Agent (Section 10).
    Analyzes turn-by-turn psychological manipulation techniques across all 12 core attack vectors:
    Urgency, Authority, Fear, Threat, Reward, Scarcity, Impersonation, Emotional manipulation,
    Isolation, Secrecy, Pressure, and Time limitation.
    """

    PATTERNS = [
        ("URGENCY", r"\b(immediately|right now|urgently|at once|without delay|hurry)\b", "HIGH"),
        ("TIME_LIMITATION", r"\b(within (\d+|few) (minutes|hours)|today itself|offer expires|deadline)\b", "HIGH"),
        ("AUTHORITY", r"\b(calling from your bank|police department|cbi officer|customs clearance|rbi official|crime branch)\b", "HIGH"),
        ("FEAR", r"\b(account (will be|has been) (blocked|suspended|frozen|closed)|arrested|warrant issued|penalized)\b", "CRITICAL"),
        ("THREAT", r"\b(legal action|police will be sent|fir will be registered|property seized|digital arrest)\b", "CRITICAL"),
        ("REWARD", r"\b(congratulations|lottery won|lucky draw prize|cashback approved|exclusive reward)\b", "MEDIUM"),
        ("SCARCITY", r"\b(only (\d+) slots left|last chance|offer valid for today only)\b", "MEDIUM"),
        ("IMPERSONATION", r"\b(this is inspector|i am your manager|i am your son|this is customer support)\b", "HIGH"),
        ("EMOTIONAL_MANIPULATION", r"\b(mom i am in trouble|please help me|i had an accident|do you not trust me)\b", "HIGH"),
        ("ISOLATION", r"\b(do not hang up|stay on the line|do not tell anyone|keep this confidential|private inquiry)\b", "CRITICAL"),
        ("SECRECY", r"\b(do not share this with bank staff|keep it secret|do not discuss with family)\b", "CRITICAL"),
        ("PRESSURE", r"\b(why are you waiting|do it now|if you don't comply|you will be held responsible)\b", "HIGH")
    ]

    def analyze(self, transcript: str) -> Dict[str, Any]:
        if not transcript or len(transcript.strip()) < 3:
            return {
                "detected_vectors": [],
                "signals": [],
                "social_engineering_risk": 0.0,
                "confidence": 0.5
            }

        norm_text = transcript.lower()
        signals: List[Dict[str, Any]] = []
        detected_vectors = set()

        for vector, pattern, severity in self.PATTERNS:
            matches = list(re.finditer(pattern, norm_text))
            for m in matches:
                detected_vectors.add(vector)
                signals.append({
                    "vector": vector,
                    "severity": severity,
                    "evidence_text": m.group(0),
                    "confidence": 0.92
                })

        # Calculate weighted psychological manipulation score
        score = 0.0
        for sig in signals:
            if sig["severity"] == "CRITICAL":
                score += 35.0
            elif sig["severity"] == "HIGH":
                score += 25.0
            else:
                score += 15.0

        risk = min(100.0, round(score, 1))
        conf = 0.94 if len(signals) > 0 else 0.70

        return {
            "detected_vectors": list(detected_vectors),
            "signals": signals,
            "social_engineering_risk": risk,
            "confidence": conf
        }
