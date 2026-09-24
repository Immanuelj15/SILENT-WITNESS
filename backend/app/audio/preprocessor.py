import os
import io
import wave
import uuid
import numpy as np
from typing import Tuple, Optional
from backend.app.core.config import settings

class AudioPreprocessor:
    """
    Audio Preprocessor: Validates format and size, converts raw audio bytes
    into standard 16kHz 16-bit mono PCM numpy array, with secure temporary file handling.
    """

    @staticmethod
    def validate_file_size(size_bytes: int) -> bool:
        max_bytes = settings.MAX_AUDIO_UPLOAD_SIZE_MB * 1024 * 1024
        return size_bytes <= max_bytes

    @classmethod
    def load_audio_from_bytes(cls, audio_bytes: bytes) -> Tuple[np.ndarray, int]:
        """
        Parses audio bytes into float32 numpy array and sample rate.
        Supports standard PCM WAV bytes natively. For WebM/other chunks, parses RIFF/WAV or raw PCM.
        """
        if not audio_bytes or len(audio_bytes) < 44:
            raise ValueError("Audio data is empty or too short to contain a valid audio header.")

        # Attempt to read as standard WAV
        try:
            with io.BytesIO(audio_bytes) as wav_file:
                with wave.open(wav_file, "rb") as wf:
                    n_channels = wf.getnchannels()
                    sampwidth = wf.getsampwidth()
                    framerate = wf.getframerate()
                    n_frames = wf.getnframes()
                    raw_data = wf.readframes(n_frames)

                    # Interpret PCM data based on bit depth
                    if sampwidth == 2:
                        data = np.frombuffer(raw_data, dtype=np.int16).astype(np.float32) / 32768.0
                    elif sampwidth == 1:
                        data = (np.frombuffer(raw_data, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
                    elif sampwidth == 4:
                        data = np.frombuffer(raw_data, dtype=np.int32).astype(np.float32) / 2147483648.0
                    else:
                        raise ValueError(f"Unsupported bit depth sample width: {sampwidth}")

                    # Convert stereo to mono if needed
                    if n_channels > 1:
                        data = data.reshape(-1, n_channels).mean(axis=1)

                    return data, framerate
        except Exception as wav_err:
            # Fallback: Check if raw 16kHz 16-bit PCM bytes
            try:
                data = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
                if len(data) > 0:
                    return data, settings.SAMPLE_RATE
            except Exception:
                pass
            raise ValueError(f"Unable to decode audio format: {str(wav_err)}")

    @classmethod
    def resample_if_needed(cls, data: np.ndarray, orig_sr: int, target_sr: int = 16000) -> np.ndarray:
        if orig_sr == target_sr:
            return data
        # Linear interpolation resampling
        duration = len(data) / orig_sr
        new_length = int(duration * target_sr)
        if new_length <= 0:
            return data
        resampled = np.interp(
            np.linspace(0, len(data), new_length, endpoint=False),
            np.arange(len(data)),
            data
        )
        return resampled.astype(np.float32)

    @classmethod
    def save_temp_wav(cls, data: np.ndarray, sample_rate: int = 16000) -> str:
        """
        Saves float32 audio to a temporary 16kHz WAV file.
        Returns file path.
        """
        filename = f"audio_{uuid.uuid4().hex}.wav"
        filepath = os.path.join(settings.TEMP_STORAGE_DIR, filename)

        # Scale to 16-bit PCM
        scaled = np.clip(data, -1.0, 1.0) * 32767.0
        pcm16 = scaled.astype(np.int16)

        with wave.open(filepath, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(pcm16.tobytes())

        return filepath

    @staticmethod
    def cleanup_temp_file(filepath: Optional[str]):
        if filepath and os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception:
                pass
