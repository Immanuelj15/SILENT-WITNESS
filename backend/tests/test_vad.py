import numpy as np
from backend.app.ingestion.vad import VoiceActivityDetector

def test_vad_silence_vs_speech():
    vad = VoiceActivityDetector(sample_rate=16000, energy_threshold=0.005)
    
    # Generate 1s of silence
    silence = np.zeros(16000, dtype=np.float32)
    assert vad.get_speech_ratio(silence) == 0.0

    # Generate 1s of active speech tone
    t = np.linspace(0, 1.0, 16000)
    tone = (0.5 * np.sin(2 * np.pi * 300 * t)).astype(np.float32)
    assert vad.get_speech_ratio(tone) > 0.8

def test_overlapping_chunking():
    vad = VoiceActivityDetector(sample_rate=16000)
    t = np.linspace(0, 4.0, 64000)
    tone = (0.4 * np.sin(2 * np.pi * 250 * t)).astype(np.float32)

    chunks = vad.chunk_overlapping_windows(tone, window_sec=2.0, hop_sec=1.0)
    # 4s audio with 2s window and 1s hop should produce 3 chunks
    assert len(chunks) == 3
    assert len(chunks[0]) == 32000
