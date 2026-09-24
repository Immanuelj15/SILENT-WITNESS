from backend.app.audio.voice_consistency import VoiceConsistencyChecker
from backend.app.models.schemas import VoiceAcousticMetrics

def test_voice_consistency_matching():
    checker = VoiceConsistencyChecker()
    baseline = VoiceAcousticMetrics(
        spectral_centroid=1800.0,
        spectral_flatness=0.04,
        pitch_jitter=0.6,
        pitch_shimmer=1.2
    )
    checker.enroll_voice_profile("user_son", baseline)

    # Identical current metrics
    auth, drift, exp = checker.verify_consistency(baseline, "user_son")
    assert auth >= 0.9
    assert drift <= 5.0

    # Drastically altered synthetic metrics
    altered = VoiceAcousticMetrics(
        spectral_centroid=3500.0,
        spectral_flatness=0.45,
        pitch_jitter=0.01,
        pitch_shimmer=10.0
    )
    auth_alt, drift_alt, exp_alt = checker.verify_consistency(altered, "user_son")
    assert drift_alt > 40.0
    assert auth_alt < 0.6
    assert "mismatch" in exp_alt
