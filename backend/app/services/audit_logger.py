"""
Tamper-Evident Cryptographic Session Audit Logger (Tier 3 Architecture).

Creates an append-only, SHA-256 hash-chained event ledger for every active call session.
Ensures that transcript evidence, risk evaluations, and intervention timestamps cannot
be modified or repudiated. Formatted for evidentiary submission to cybercrime authorities.
"""

from typing import Dict, List, Any, Optional
import hashlib
import json
import time


class AuditBlock:
    def __init__(self, index: int, timestamp: float, event_type: str, data: Dict[str, Any], previous_hash: str):
        self.index = index
        self.timestamp = timestamp
        self.event_type = event_type
        self.data = data
        self.previous_hash = previous_hash
        self.hash = self.compute_hash()

    def compute_hash(self) -> str:
        serialized = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "event_type": self.event_type,
            "data": self.data,
            "previous_hash": self.previous_hash
        }, sort_keys=True)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "event_type": self.event_type,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "hash": self.hash
        }


class SessionAuditLedger:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.chain: List[AuditBlock] = []
        # Create Genesis Block
        self.add_block(
            event_type="SESSION_GENESIS",
            data={
                "session_id": session_id,
                "message": "Silent Witness Tamper-Evident Audit Ledger Initialized",
                "system_version": "2.0.0-PROD"
            }
        )

    def add_block(self, event_type: str, data: Dict[str, Any]) -> AuditBlock:
        prev_hash = self.chain[-1].hash if self.chain else "0" * 64
        block = AuditBlock(
            index=len(self.chain),
            timestamp=time.time(),
            event_type=event_type,
            data=data,
            previous_hash=prev_hash
        )
        self.chain.append(block)
        return block

    def verify_integrity(self) -> Dict[str, Any]:
        """
        Validates the complete hash chain. Returns valid=True if no tampering detected.
        """
        if not self.chain:
            return {"valid": False, "reason": "Empty ledger"}

        for i in range(1, len(self.chain)):
            current = self.chain[i]
            prev = self.chain[i - 1]

            # 1. Check previous hash reference
            if current.previous_hash != prev.hash:
                return {
                    "valid": False,
                    "tampered_index": i,
                    "reason": f"Previous hash mismatch at block {i}"
                }

            # 2. Check current block hash recalculation
            if current.hash != current.compute_hash():
                return {
                    "valid": False,
                    "tampered_index": i,
                    "reason": f"Corrupted hash signature at block {i}"
                }

        return {
            "valid": True,
            "total_blocks": len(self.chain),
            "root_hash": self.chain[0].hash,
            "latest_hash": self.chain[-1].hash,
            "tamper_evident": True
        }

    def export_evidence_package(self) -> Dict[str, Any]:
        """
        Exports formal evidence package suitable for submission to cybercrime authorities (1930 / FTC).
        """
        integrity = self.verify_integrity()
        return {
            "evidence_package_version": "1.0",
            "session_id": self.session_id,
            "export_timestamp": time.time(),
            "chain_integrity": integrity,
            "ledger_blocks": [b.to_dict() for b in self.chain]
        }


# In-memory session registry (session_id -> SessionAuditLedger)
_SESSION_LEDGERS: Dict[str, SessionAuditLedger] = {}


def get_or_create_ledger(session_id: str) -> SessionAuditLedger:
    if session_id not in _SESSION_LEDGERS:
        _SESSION_LEDGERS[session_id] = SessionAuditLedger(session_id)
    return _SESSION_LEDGERS[session_id]
