import re
from typing import List, Dict, Tuple, Optional
from backend.app.models.schemas import EvidenceItem

class EvidenceVerifier:
    """
    Evidence Grounding Verification Engine.
    Ensures that any claim made by an AI Agent has a literal verbatim or semantic
    anchor in the live conversation transcript. Unsupported claims are discarded.
    """

    @staticmethod
    def verify_claim_against_transcript(
        claim_phrase: str,
        full_transcript: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Validates if claim_phrase is grounded in full_transcript.
        Returns (is_supported, matched_exact_text_or_normalized).
        """
        if not full_transcript or not claim_phrase:
            return False, None

        norm_transcript = full_transcript.lower()
        norm_claim = claim_phrase.lower().strip()

        # 1. Exact substring check
        if norm_claim in norm_transcript:
            # Locate original casing snippet from transcript
            start_idx = norm_transcript.find(norm_claim)
            original_snippet = full_transcript[start_idx : start_idx + len(claim_phrase)]
            return True, original_snippet

        # 2. Token overlap / fuzzy subphrase check (for minor transcription variations)
        claim_words = re.findall(r"\w+", norm_claim)
        if len(claim_words) >= 2:
            # Check if all words appear within a tight proximity window (e.g., within 6 words)
            transcript_words = re.findall(r"\w+", norm_transcript)
            for i in range(len(transcript_words) - len(claim_words) + 1):
                window = transcript_words[i : i + len(claim_words) + 3]
                matched_count = sum(1 for w in claim_words if w in window)
                if matched_count / len(claim_words) >= 0.8:
                    matched_snippet = " ".join(window[:len(claim_words) + 1])
                    return True, matched_snippet

        return False, None

    @classmethod
    def filter_and_ground_evidence(
        cls,
        proposed_evidence_items: List[Dict[str, str]],
        transcript: str
    ) -> Tuple[List[EvidenceItem], List[str]]:
        """
        Takes raw proposed evidence from agents, verifies against transcript,
        returns (grounded_evidence, rejected_hallucinated_claims).
        """
        grounded: List[EvidenceItem] = []
        rejected: List[str] = []

        for item in proposed_evidence_items:
            phrase = item.get("phrase", "")
            tag = item.get("tag", "General Observation")
            note = item.get("note", "")

            is_grounded, matched_snippet = cls.verify_claim_against_transcript(phrase, transcript)

            if is_grounded and matched_snippet:
                grounded.append(EvidenceItem(
                    exact_phrase=matched_snippet,
                    detected_tag=tag,
                    is_grounded_in_transcript=True,
                    context_note=note or f"Direct evidence verified: '{matched_snippet}'"
                ))
            else:
                rejected.append(f"Rejected unsupported claim: '{phrase}' (not found in transcript)")

        return grounded, rejected
