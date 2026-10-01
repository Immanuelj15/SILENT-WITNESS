import re
import json
from typing import List, Dict, Tuple, Optional, Any
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


import hashlib
import datetime
from pydantic import BaseModel, Field


class MerkleAuditBlock(BaseModel):
    """
    Immutable Merkle-linked cryptographic audit record.
    Chains previous block hashes with current transcript and threat verdict hashes.
    """
    block_index: int
    session_id: str
    timestamp: str
    previous_hash: str
    transcript_hash: str
    verdict_hash: str
    merkle_root: str
    audit_hash: str


class AuditTamperingDetectedError(Exception):
    """Raised when Merkle parent-child hash verification fails, indicating record alteration."""
    pass


class MerkleAuditLedger:
    """
    In-memory / persistence-ready Merkle ledger for live call sessions.
    Guarantees tamper-evident traceability for legal forensics and regulatory compliance.
    """
    GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

    def __init__(self):
        self._chains: Dict[str, List[MerkleAuditBlock]] = {}

    @staticmethod
    def sha256(data: str) -> str:
        return hashlib.sha256(data.encode("utf-8")).hexdigest()

    def record_event(
        self,
        session_id: str,
        transcript: str,
        verdict: Dict[str, Any]
    ) -> MerkleAuditBlock:
        if session_id not in self._chains:
            self._chains[session_id] = []

        chain = self._chains[session_id]
        block_index = len(chain)
        previous_hash = chain[-1].audit_hash if chain else self.GENESIS_HASH

        t_hash = self.sha256(transcript or "")
        v_hash = self.sha256(json.dumps(verdict, sort_keys=True))

        # Merkle tree root of [t_hash, v_hash]
        merkle_root = self.sha256(f"{t_hash}:{v_hash}")
        timestamp = datetime.datetime.utcnow().isoformat()

        # Final chained audit hash: SHA-256(index + timestamp + prev_hash + merkle_root)
        audit_hash = self.sha256(f"{block_index}:{timestamp}:{previous_hash}:{merkle_root}")

        block = MerkleAuditBlock(
            block_index=block_index,
            session_id=session_id,
            timestamp=timestamp,
            previous_hash=previous_hash,
            transcript_hash=t_hash,
            verdict_hash=v_hash,
            merkle_root=merkle_root,
            audit_hash=audit_hash
        )

        chain.append(block)
        return block

    def get_latest_hash(self, session_id: str) -> str:
        chain = self._chains.get(session_id)
        if chain:
            return chain[-1].audit_hash
        return self.GENESIS_HASH

    def get_session_chain(self, session_id: str) -> List[MerkleAuditBlock]:
        return self._chains.get(session_id, [])

    def verify_chain(self, session_id: str) -> bool:
        try:
            self.assert_chain_integrity(session_id)
            return True
        except AuditTamperingDetectedError:
            return False

    def assert_chain_integrity(self, session_id: str) -> None:
        """
        Validates the strict parent-child Merkle hash chain.
        Raises AuditTamperingDetectedError immediately if any block or root has been modified.
        """
        chain = self._chains.get(session_id, [])
        if not chain:
            return

        for i, block in enumerate(chain):
            expected_prev = chain[i - 1].audit_hash if i > 0 else self.GENESIS_HASH
            if block.previous_hash != expected_prev:
                raise AuditTamperingDetectedError(
                    f"Audit tampering detected in session '{session_id}' at block {block.block_index}: "
                    f"Previous hash mismatch. Expected '{expected_prev}', got '{block.previous_hash}'."
                )

            recalculated_merkle = self.sha256(f"{block.transcript_hash}:{block.verdict_hash}")
            if block.merkle_root != recalculated_merkle:
                raise AuditTamperingDetectedError(
                    f"Audit tampering detected in session '{session_id}' at block {block.block_index}: "
                    f"Merkle root mismatch. Content hash was altered!"
                )

            recalculated_audit = self.sha256(
                f"{block.block_index}:{block.timestamp}:{block.previous_hash}:{block.merkle_root}"
            )
            if block.audit_hash != recalculated_audit:
                raise AuditTamperingDetectedError(
                    f"Audit tampering detected in session '{session_id}' at block {block.block_index}: "
                    f"Chained block hash mismatch. Block header was altered!"
                )


# Global ledger instance
merkle_audit_ledger = MerkleAuditLedger()

