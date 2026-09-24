import pytest
import numpy as np
from backend.app.audio.preprocessor import AudioPreprocessor
from backend.app.audio.deepfake_detector import VoiceDeepfakeDetector

def test_audio_preprocessor_resampling():
    sr_orig = 8000
    t = np.linspace(0, 1.0, sr_orig)
    sin_wave = (0.5 * np.sin(2 * np.pi * 440 * t)).astype(np.float32)
    
    resampled = AudioPreprocessor.resample_if_needed(sin_wave, sr_orig, 16000)
    assert len(resampled) == 16000
    assert isinstance(resampled, np.ndarray)

def test_deepfake_detector_metrics():
    detector = VoiceDeepfakeDetector(sample_rate=16000)
    # Generate 1.5 seconds of composite audio signal
    t = np.linspace(0, 1.5, 24000)
    composite_audio = (
        0.3 * np.sin(2 * np.pi * 150 * t) +
        0.1 * np.sin(2 * np.pi * 300 * t) +
        0.05 * np.random.normal(0, 0.05, len(t))
    ).astype(np.float32)

    res = detector.analyze_audio(composite_audio, 1.5)
    assert 0.0 <= res.voiceRisk <= 100.0
    assert 0.0 <= res.confidence <= 1.0
    assert res.metrics.spectral_centroid > 0
    assert res.metrics.zero_crossing_rate >= 0
    assert len(res.indicators) > 0

def test_corrupted_audio_handling():
    with pytest.raises(ValueError):
        AudioPreprocessor.load_audio_from_bytes(b"invalid_corrupt_data_string")

def test_empty_audio_handling():
    with pytest.raises(ValueError):
        AudioPreprocessor.load_audio_from_bytes(b"")
