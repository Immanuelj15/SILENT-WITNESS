"""
Screen Share Agent (Multi-Agent Subsystem).

Coordinates with IntentAgent and SupervisorAgent to detect screen-sharing risks,
banking-app exposure, and remote tool installations.
"""

from typing import Dict, List, Any
from backend.app.services.screen_share_engine import screen_share_engine


class ScreenShareAgent:
    def __init__(self):
        self.engine = screen_share_engine

    def analyze(self, transcript: str) -> Dict[str, Any]:
        result = self.engine.analyze_text(transcript)
        
        proposed_evidence = []
        if result["detected"]:
            for pat in result["matched_patterns"]:
                proposed_evidence.append({
                    "phrase": pat,
                    "tag": "Screen Sharing / Remote Access",
                    "note": f"Caller solicited screen sharing or remote takeover: '{pat}'"
                })

        return {
            "screen_share_risk": float(result["screen_share_risk"]),
            "is_screen_share_demanded": result["detected"],
            "risk_level": result["risk_level"],
            "assets_at_risk": result["target_assets_at_risk"],
            "proposed_evidence": proposed_evidence,
            "warning": result["warning"],
            "recommended_action": result["recommended_action"],
            "confidence": 0.92 if result["detected"] else 0.85
        }


screen_agent = ScreenShareAgent()
