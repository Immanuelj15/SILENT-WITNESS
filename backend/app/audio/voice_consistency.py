import numpy as np
from typing import Dict, Any, Optional, Tuple
from backend.app.models.schemas import VoiceAcousticMetrics

class VoiceConsistencyChecker:
    """
    Voice Consistency & Enrolled Profile Comparator.
    Validates whether the incoming acoustic profile matches an enrolled baseline
    (e.g., enrolled family member or verified representative) or drifts during the call.
    """

    def __init__(self):
        # In-memory session acoustic profile history
        self.enrolled_profiles: Dict[str, Dict[str, float]] = {}

    def enroll_voice_profile(self, identity_id: str, metrics: VoiceAcousticMetrics):
        """
        Stores baseline acoustic features for a known identity.
        """
        self.enrolled_profiles[identity_id] = {
            "centroid": metrics.spectral_centroid,
            "flatness": metrics.spectral_flatness,
            "pitch_jitter": metrics.pitch_jitter,
            "pitch_shimmer": metrics.pitch_shimmer
        }

    def verify_consistency(
        self,
        current_metrics: VoiceAcousticMetrics,
        claimed_identity_id: Optional[str] = None
    ) -> Tuple[float, float, str]:
        """
        Compares current acoustic metrics against enrolled baseline if present.
        Returns (authenticity_score [0.0-1.0], drift_score [0.0-100.0], explanation).
        """
        if not claimed_identity_id or claimed_identity_id not in self.enrolled_profiles:
            # No prior enrollment baseline available
            return 0.85, 0.0, "No prior enrolled voice baseline available; evaluating live acoustics independently."

        baseline = self.enrolled_profiles[claimed_identity_id]

        # Calculate deviation across key spectral & prosodic dimensions
        c_diff = abs(current_metrics.spectral_centroid - baseline["centroid"]) / max(1.0, baseline["centroid"])
        f_diff = abs(current_metrics.spectral_flatness - baseline["flatness"]) / max(0.01, baseline["flatness"])
        j_diff = abs(current_metrics.pitch_jitter - baseline["pitch_jitter"]) / max(0.1, baseline["pitch_jitter"])

        drift = float((c_diff * 40.0) + (f_diff * 35.0) + (j_diff * 25.0))
        drift = min(100.0, max(0.0, drift))

        authenticity_score = round(max(0.0, 1.0 - (drift / 100.0)), 2)

        if drift > 40.0:
            explanation = f"Significant acoustic mismatch ({drift:.1f}%) detected against enrolled voice profile for '{claimed_identity_id}'."
        else:
            explanation = f"Acoustic profile is consistent (deviation {drift:.1f}%) with enrolled profile."

        return authenticity_score, drift, explanation
