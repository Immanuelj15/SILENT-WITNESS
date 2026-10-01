import pytest
from backend.app.core.llm_gateway import MockLLMService, LLMGateway
from backend.app.evidence.verifier import merkle_audit_ledger
from backend.app.api.websocket import mask_pii

def test_mock_llm_digital_arrest():
    transcript = "This is Mumbai Police Cyber Crime Cell. A parcel with drugs was seized. You are under digital arrest."
    result = MockLLMService.evaluate(transcript)
    assert result["threat_level"] == "CRITICAL"
    assert result["composite_risk"] >= 0.90
    assert "Digital Arrest" in result["identified_scam_type"]
    assert len(result["live_coaching_directives"]) > 0

def test_mock_llm_remote_access():
    transcript = "Sir please open anydesk or download teamviewer so we can verify your account."
    result = MockLLMService.evaluate(transcript)
    assert result["threat_level"] == "CRITICAL"
    assert result["composite_risk"] >= 0.90
    assert "Remote Access" in result["identified_scam_type"]

def test_mock_llm_financial_otp():
    transcript = "Your SBI bank account will be blocked today for KYC. Please share the 6 digit OTP."
    result = MockLLMService.evaluate(transcript)
    assert result["threat_level"] == "HIGH"
    assert result["composite_risk"] >= 0.80
    assert "OTP" in result["identified_scam_type"]

def test_mock_llm_benign():
    transcript = "Hi mom, I am heading to the grocery store. Do we need anything?"
    result = MockLLMService.evaluate(transcript)
    assert result["threat_level"] == "SAFE"
    assert result["composite_risk"] <= 0.10

def test_pii_masking():
    raw_text = "My card number is 4111 2222 3333 4444 and my otp is 987654 for account 123456789012."
    masked = mask_pii(raw_text)
    assert "4111 2222 3333 4444" not in masked
    assert "[CARD_REDACTED]" in masked
    assert "987654" not in masked
    assert "[OTP_REDACTED]" in masked
    assert "123456789012" not in masked
    assert "[ACCOUNT_REDACTED]" in masked

def test_merkle_audit_ledger_chaining():
    session_id = "test-merkle-session"
    b0 = merkle_audit_ledger.record_event(session_id, "Hello", {"status": "SAFE"})
    assert b0.block_index == 0
    assert b0.previous_hash == merkle_audit_ledger.GENESIS_HASH

    b1 = merkle_audit_ledger.record_event(session_id, "Send money now", {"status": "CRITICAL"})
    assert b1.block_index == 1
    assert b1.previous_hash == b0.audit_hash
    assert b1.audit_hash != b0.audit_hash

    # Verify cryptographic integrity
    assert merkle_audit_ledger.verify_chain(session_id) is True
