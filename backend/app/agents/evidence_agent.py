from typing import List, Dict, Any, Tuple
from backend.app.evidence.verifier import EvidenceVerifier
from backend.app.models.schemas import EvidenceItem

class EvidenceAgent:
    """
    Evidence Agent: Checks candidate findings against the literal transcript.
    Enforces that LLM/heuristic conclusions are anchored in real words spoken.
    """

    def __init__(self):
        self.verifier = EvidenceVerifier()

    def ground_evidence(
        self,
        candidate_items: List[Dict[str, str]],
        transcript: str
    ) -> Tuple[List[EvidenceItem], List[str]]:
        return self.verifier.filter_and_ground_evidence(candidate_items, transcript)
