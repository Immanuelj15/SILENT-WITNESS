"""
Emotional Manipulation & User Stress/Hesitation Engine (Tier 3 Architecture).

Provides a dedicated sub-score (0-100) for psychological manipulation vectors
(Fear, Urgency, Intimidation, Shame, Isolation) independent of literal content.
Also analyzes user stress, hesitation, and vulnerability markers during high-pressure demands.
"""

from typing import Dict, List, Any
import re


class EmotionEngine:
    def __init__(self):
        # Lexical and prosodic manipulation indicators
        self.fear_patterns = [
            r"\b(arrest|jail|police|fir|warrant|prison|punishment|penalty|court|legal action|consequences)\b",
            r"\b(seized|illegal|contraband|drugs|freeze|confiscate|destroy|criminal)\b"
        ]
        self.urgency_patterns = [
            r"\b(immediately|right now|hurry|instant|24 hours|within minutes|dont waste time|urgent|before it blocks)\b",
            r"\b(quick|fast|deadline|now now|at once|run)\b"
        ]
        self.intimidation_patterns = [
            r"\b(do not argue|listen to me|you are in trouble|obey|officer speaking|senior inspector)\b",
            r"\b(failure to comply|liable for prosecution|you have no choice|keep quiet)\b"
        ]
        self.isolation_patterns = [
            r"\b(dont tell|do not disclose|secret|stay in room|close door|nobody should know)\b",
            r"\b(keep confidential|do not discuss with family|disconnect from wifi)\b"
        ]
        # User hesitation & stress markers
        self.hesitation_patterns = [
            r"\b(uh|um|wait|wait a minute|give me a moment|let me check|i'm not sure|why do you need)\b",
            r"\b(can i call back|is this safe|i don't understand|please don't arrest|i am scared)\b"
        ]

    def analyze_turns(self, turns: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes conversational turns separated by speaker.
        turns is a list of dicts: {"speaker": "caller"|"user", "text": str, "timestamp": float}
        """
        caller_texts = [t["text"].lower() for t in turns if t.get("speaker") == "caller"]
        user_texts = [t["text"].lower() for t in turns if t.get("speaker") == "user"]

        combined_caller = " ".join(caller_texts)
        combined_user = " ".join(user_texts)

        # 1. Calculate Emotional Manipulation Vectors (Caller side)
        fear_hits = sum(len(re.findall(p, combined_caller)) for p in self.fear_patterns)
        urgency_hits = sum(len(re.findall(p, combined_caller)) for p in self.urgency_patterns)
        intimidation_hits = sum(len(re.findall(p, combined_caller)) for p in self.intimidation_patterns)
        isolation_hits = sum(len(re.findall(p, combined_caller)) for p in self.isolation_patterns)

        fear_score = min(100, fear_hits * 25)
        urgency_score = min(100, urgency_hits * 20)
        intimidation_score = min(100, intimidation_hits * 30)
        isolation_score = min(100, isolation_hits * 35)

        # Composite Emotional Manipulation Sub-score (0-100) with multi-vector synergy
        base_manipulation = (fear_score * 0.35) + (urgency_score * 0.25) + (intimidation_score * 0.25) + (isolation_score * 0.15)
        active_vectors_count = sum(1 for s in [fear_score, urgency_score, intimidation_score, isolation_score] if s > 0)
        # Compound coercion synergy if attacker coordinates 3+ vectors
        if active_vectors_count >= 3:
            base_manipulation += 15.0

        emotional_manipulation_score = min(100, int(base_manipulation))

        # 2. Calculate User Hesitation and Stress Markers (User side)
        hesitation_hits = sum(len(re.findall(p, combined_user)) for p in self.hesitation_patterns)
        user_stress_score = min(100, hesitation_hits * 20)

        # Determine dominant manipulation tactic
        vector_scores = {
            "Fear & Intimidation": fear_score,
            "Artificial Urgency": urgency_score,
            "Authority Coercion": intimidation_score,
            "Social Isolation": isolation_score
        }
        dominant_tactic = max(vector_scores, key=vector_scores.get) if emotional_manipulation_score > 20 else "Normal Conversation"

        # Trajectory / Escalation check
        is_escalating = (len(caller_texts) >= 3 and
                         (fear_hits >= 2 or urgency_hits >= 2 or intimidation_hits >= 1))

        return {
            "emotional_manipulation_score": emotional_manipulation_score,
            "dominant_tactic": dominant_tactic,
            "is_escalating": is_escalating,
            "vector_breakdown": {
                "fear": fear_score,
                "urgency": urgency_score,
                "intimidation": intimidation_score,
                "isolation": isolation_score
            },
            "user_stress_score": user_stress_score,
            "user_hesitation_detected": hesitation_hits > 0,
            "user_vulnerability_level": (
                "HIGH" if user_stress_score >= 60 else
                "MODERATE" if user_stress_score >= 30 else "LOW"
            ),
            "summary": (
                f"High emotional coercion detected: caller is actively utilizing {dominant_tactic} to bypass cognitive defenses."
                if emotional_manipulation_score >= 50 else
                "Low to moderate emotional intensity in conversation delivery."
            )
        }


emotion_engine = EmotionEngine()
