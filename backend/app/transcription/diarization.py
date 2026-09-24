import time
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class DialogueTurn(BaseModel):
    speaker: str  # "CALLER" or "USER"
    text: str
    timestamp_offset: float  # seconds into call
    is_flagged: bool = False
    flagged_tag: Optional[str] = None

class SpeakerDiarizer:
    """
    Speaker Diarization & Conversational Turn Segmentation Engine.
    Separates caller turns from recipient user turns.
    Detects role shifts, assigns timestamps, and labels dialogue turns.
    """

    CALLER_ROLE_PATTERNS = [
        "i am calling", "this is", "calling from", "tell me", "provide your",
        "enter pin", "share otp", "your account", "do not hang up", "under arrest"
    ]
    USER_ROLE_PATTERNS = [
        "who is this", "why do you need", "i will check", "wait a minute",
        "let me call back", "i am at work", "i did not request", "how do i know"
    ]

    def __init__(self):
        self.turns: List[DialogueTurn] = []
        self.call_start_time = time.time()

    def segment_transcript_into_turns(self, full_transcript: str) -> List[DialogueTurn]:
        """
        Parses continuous transcript or marked transcript into chronological speaker turns.
        Supports automatic speaker heuristic or explicit turn prefixes (e.g. 'Caller:', 'User:').
        """
        if not full_transcript:
            return []

        # Check if already tagged with explicit prefixes
        raw_lines = full_transcript.replace(". ", ".\n").split("\n")
        dialogue: List[DialogueTurn] = []
        elapsed = 0.0

        for line in raw_lines:
            text = line.strip()
            if not text:
                continue

            lower = text.lower()
            # Determine speaker based on conversational indicators
            if lower.startswith("caller:") or lower.startswith("[caller]"):
                speaker = "CALLER"
                clean_text = text.split(":", 1)[-1].strip()
            elif lower.startswith("user:") or lower.startswith("[user]"):
                speaker = "USER"
                clean_text = text.split(":", 1)[-1].strip()
            else:
                # Heuristic attribution
                is_caller_intent = any(p in lower for p in self.CALLER_ROLE_PATTERNS)
                is_user_intent = any(p in lower for p in self.USER_ROLE_PATTERNS)

                if is_caller_intent:
                    speaker = "CALLER"
                elif is_user_intent:
                    speaker = "USER"
                else:
                    # Default: Inbound suspicious call analysis defaults to caller speaker
                    speaker = "CALLER"
                clean_text = text

            dialogue.append(DialogueTurn(
                speaker=speaker,
                text=clean_text,
                timestamp_offset=round(elapsed, 1),
                is_flagged=False
            ))
            elapsed += max(1.5, len(clean_text.split()) * 0.35)

        return dialogue
