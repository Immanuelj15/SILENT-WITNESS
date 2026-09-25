"""
Video Agent (Multi-Agent Subsystem).

Analyzes video stream signals and visual extortion tactics in conjunction with SupervisorAgent.
"""

from typing import Dict, List, Any, Optional
from backend.app.services.video_engine import video_analysis_engine


class VideoAgent:
    def __init__(self):
        self.engine = video_analysis_engine

    def analyze(self, transcript: str, frame_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        result = self.engine.analyze_video_context(transcript, frame_metadata)
        
        proposed_evidence = []
        if result["is_extortion_detected"]:
            proposed_evidence.append({
                "phrase": "recorded",
                "tag": "Video Extortion",
                "note": "Caller used video recording threat or financial extortion demand"
            })
        if "lip_sync_inconsistency" in result["signals"]:
            proposed_evidence.append({
                "phrase": "video frame",
                "tag": "Lip Sync Anomaly",
                "note": "Visual lip-sync inconsistency observed in video frames"
            })
        if "face_temporal_anomaly" in result["signals"]:
            proposed_evidence.append({
                "phrase": "video frame",
                "tag": "Face Temporal Anomaly",
                "note": "Face temporal texture anomaly observed in video feed"
            })

        return {
            "visual_risk": result["visualRisk"],
            "confidence": result["confidence"],
            "signals": result["signals"],
            "is_extortion": result["is_extortion_detected"],
            "proposed_evidence": proposed_evidence,
            "category": result["category"],
            "warning": result["warning"],
            "recommended_action": result["recommended_action"]
        }


video_agent = VideoAgent()
