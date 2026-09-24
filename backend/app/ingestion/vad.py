import numpy as np
from typing import List, Tuple

class VoiceActivityDetector:
    """
    Voice Activity Detection (VAD) & Overlapping Window Ingestion Layer.
    Isolates active speech segments, skips prolonged silence/background noise,
    and produces overlapping windows for low-latency streaming pipeline.
    """

    def __init__(self, sample_rate: int = 16000, frame_duration_ms: int = 30, energy_threshold: float = 0.005):
        self.sr = sample_rate
        self.frame_size = int(self.sr * (frame_duration_ms / 1000.0))
        self.energy_threshold = energy_threshold

    def calculate_frame_energy(self, frame: np.ndarray) -> float:
        if len(frame) == 0:
            return 0.0
        return float(np.mean(frame ** 2))

    def detect_speech_frames(self, audio_data: np.ndarray) -> List[bool]:
        """
        Labels each frame as speech (True) or silence/noise (False).
        """
        num_frames = len(audio_data) // self.frame_size
        speech_mask = []
        for i in range(num_frames):
            frame = audio_data[i * self.frame_size : (i + 1) * self.frame_size]
            energy = self.calculate_frame_energy(frame)
            speech_mask.append(energy >= self.energy_threshold)
        return speech_mask

    def get_speech_ratio(self, audio_data: np.ndarray) -> float:
        """
        Returns fraction of audio chunk that contains active voice (0.0 to 1.0).
        """
        mask = self.detect_speech_frames(audio_data)
        if not mask:
            return 0.0
        return float(sum(mask) / len(mask))

    def chunk_overlapping_windows(self, audio_data: np.ndarray, window_sec: float = 2.0, hop_sec: float = 1.0) -> List[np.ndarray]:
        """
        Splits incoming stream into overlapping chunks (e.g. 2s window with 1s hop).
        """
        window_size = int(window_sec * self.sr)
        hop_size = int(hop_sec * self.sr)
        chunks = []

        if len(audio_data) <= window_size:
            return [audio_data]

        for start in range(0, len(audio_data) - window_size + 1, hop_size):
            chunk = audio_data[start : start + window_size]
            # Only keep chunks with active speech
            if self.get_speech_ratio(chunk) >= 0.15:
                chunks.append(chunk)

        return chunks
