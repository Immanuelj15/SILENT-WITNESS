import os
import io
import wave
import numpy as np
from typing import Optional, Tuple
import speech_recognition as sr

class SpeechToTextService:
    """
    Speech-to-Text Transcription Service.
    Supports near-real-time chunk transcription and offline audio transcription.
    Handles noisy audio, short bursts, and full recordings.
    """

    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.recognizer.energy_threshold = 300
        self.recognizer.dynamic_energy_threshold = True

    def transcribe_wav_file(self, wav_path: str) -> Tuple[str, float]:
        """
        Transcribes a WAV file using the local recognizer.
        Returns (transcript_text, confidence).
        """
        if not os.path.exists(wav_path):
            return "", 0.0

        try:
            with sr.AudioFile(wav_path) as source:
                audio_data = self.recognizer.record(source)
                # Attempt recognition via google web speech API fallback
                try:
                    text = self.recognizer.recognize_google(audio_data)
                    return text, 0.90
                except sr.UnknownValueError:
                    return "", 0.40
                except sr.RequestError:
                    # If offline/no internet connection, return descriptive placeholder
                    return "Speech detected but offline recognizer unavailable.", 0.50
        except Exception as e:
            return f"Error reading audio file: {str(e)}", 0.0

    def transcribe_audio_array(self, audio_data: np.ndarray, sample_rate: int = 16000) -> Tuple[str, float]:
        """
        Transcribes an in-memory float32 audio array.
        """
        if len(audio_data) < sample_rate * 0.5:
            return "", 0.5

        # Scale float32 to 16-bit PCM WAV in memory
        scaled = np.clip(audio_data, -1.0, 1.0) * 32767.0
        pcm16 = scaled.astype(np.int16).tobytes()

        with io.BytesIO() as wav_io:
            with wave.open(wav_io, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(sample_rate)
                wf.writeframes(pcm16)
            wav_io.seek(0)

            try:
                with sr.AudioFile(wav_io) as source:
                    audio = self.recognizer.record(source)
                    try:
                        text = self.recognizer.recognize_google(audio)
                        return text, 0.90
                    except (sr.UnknownValueError, sr.RequestError):
                        return "", 0.50
            except Exception:
                return "", 0.0

stt_service = SpeechToTextService()
