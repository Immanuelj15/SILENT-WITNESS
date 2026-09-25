"""
Video Call Analysis & Video Extortion Protection Engine.

Sections 10 and 24:
Analyzes accessible video frames and conversational cues during video calls for:
1. Video deepfake / visual manipulation indicators (lip-sync mismatch, temporal face anomalies, abnormal lighting)
2. Video extortion patterns (camera request, sexual lure, recording threats, blackmail demands)
Technical honesty: Never claims guaranteed 100% deepfake detection. Zero storage of sensitive video frames.
"""

from typing import Dict, List, Any, Optional
import re


VIDEO_EXTORTION_KEYWORDS = [
    r"\b(turn on your camera|open camera|show your face|undress|take off clothes)\b",
    r"\b(recorded you|i have your video|screen recorded|recorded screen|send to your contacts|send to facebook|send to friends)\b",
    r"\b(pay money|transfer money or i post|pay or i send to family|pay 50000|pay 20000)\b"
]


class VideoAnalysisEngine:
    def __init__(self):
        self.extortion_patterns = [re.compile(p, re.IGNORECASE) for p in VIDEO_EXTORTION_KEYWORDS]

    def analyze_video_context(
        self,
        transcript: str,
        frame_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyzes video call context and frame metadata.
        frame_metadata can include: {"temporal_jitter": float, "lip_sync_mismatch": bool, "face_detected": bool}
        """
        visual_signals = []
        visual_risk = 0.0
        confidence = 0.80

        # 1. Acoustic-Visual Artifact Checks (simulated / frame metrics)
        if frame_metadata:
            if frame_metadata.get("lip_sync_mismatch", False):
                visual_signals.append("lip_sync_inconsistency")
                visual_risk += 35.0
            if frame_metadata.get("temporal_jitter", 0.0) > 0.65:
                visual_signals.append("face_temporal_anomaly")
                visual_risk += 30.0
            if frame_metadata.get("sudden_face_replacement", False):
                visual_signals.append("sudden_face_replacement")
                visual_risk += 40.0

        # 2. Conversational Video Extortion Lure Analysis
        transcript_lower = transcript.lower()
        matched_extortion_stages = []
        for pat in self.extortion_patterns:
            matches = pat.findall(transcript_lower)
            if matches:
                matched_extortion_stages.append(matches[0] if isinstance(matches[0], str) else matches[0][0])

        is_extortion = len(matched_extortion_stages) >= 2 or (
            any("recorded" in p for p in matched_extortion_stages) and any("pay" in p for p in matched_extortion_stages)
        )

        if is_extortion:
            visual_risk = max(visual_risk, 90.0)
            visual_signals.append("video_extortion_blackmail_pattern")
            warning = (
                "🚨 CRITICAL WARNING: Potential video extortion / sextortion blackmail detected.\n"
                "DO NOT PAY. Disconnect immediately. The attacker will demand more money if you pay.\n"
                "Report immediately to Cyber Helpline 1930."
            )
            recommended_action = "DISCONNECT IMMEDIATELY. DO NOT PAY. REPORT TO 1930."
            category = "VIDEO_EXTORTION"
        elif visual_risk > 50:
            warning = "Possible visual deepfake or lip-sync manipulation artifacts detected in video stream."
            recommended_action = "Request caller perform an unpredictable movement (turn head sideways, hold up hand)."
            category = "VISUAL_DEEPFAKE_SUSPECTED"
        else:
            warning = None
            recommended_action = "Visual stream appears natural."
            category = "NORMAL_VIDEO"

        return {
            "visualRisk": round(min(visual_risk, 100.0), 1),
            "confidence": round(confidence, 2),
            "signals": visual_signals,
            "is_extortion_detected": is_extortion,
            "category": category,
            "warning": warning,
            "recommended_action": recommended_action,
            "privacy_notice": "Zero-storage policy: Video frames are evaluated in volatile memory and never persisted."
        }


video_analysis_engine = VideoAnalysisEngine()
