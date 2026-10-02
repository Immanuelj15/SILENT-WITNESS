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

def test_mock_llm_customs_seizure():
    transcript = "This is Customs clearance department. Your international consignment has been seized for narcotics. Pay the 50000 clearance fee penalty immediately."
    result = MockLLMService.evaluate(transcript)
    assert result["threat_level"] == "CRITICAL"
    assert result["composite_risk"] >= 0.90
    assert "Customs" in result["identified_scam_type"]

def test_mock_llm_electricity_disconnection():
    transcript = "Your electricity power will be cut tonight at 9:30 PM due to unpaid electricity bill. Download AnyDesk and share the OTP to update power meter."
    result = MockLLMService.evaluate(transcript)
    assert result["threat_level"] == "CRITICAL"
    assert result["composite_risk"] >= 0.90
    assert "Electricity" in result["identified_scam_type"]

def test_pii_masking():
    raw_text = (
        "My card number is 4111 2222 3333 4444, cvv is 321, expiry 05/28, "
        "and my otp is 987654 for account 123456789012. "
        "My Aadhaar is 1234 5678 9012 and PAN card is ABCDE1234F, SSN 123-45-6789."
    )
    masked = mask_pii(raw_text)
    assert "4111 2222 3333 4444" not in masked
    assert "[CARD_REDACTED]" in masked
    assert "321" not in masked
    assert "[CVV_REDACTED]" in masked
    assert "05/28" not in masked
    assert "[EXPIRY_REDACTED]" in masked
    assert "987654" not in masked
    assert "[OTP_REDACTED]" in masked
    assert "123456789012" not in masked
    assert "[ACCOUNT_REDACTED]" in masked
    assert "1234 5678 9012" not in masked
    assert "[AADHAAR_REDACTED]" in masked
    assert "ABCDE1234F" not in masked
    assert "[PAN_REDACTED]" in masked
    assert "123-45-6789" not in masked
    assert "[SSN_REDACTED]" in masked

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
    merkle_audit_ledger.assert_chain_integrity(session_id)


def test_merkle_tampering_detection_raises_exception():
    import pytest
    from backend.app.evidence.verifier import AuditTamperingDetectedError

    tampered_session = "tampered-session-1"
    b0 = merkle_audit_ledger.record_event(tampered_session, "Legitimate audio", {"risk": 0.05})
    b1 = merkle_audit_ledger.record_event(tampered_session, "Second chunk", {"risk": 0.10})

    assert merkle_audit_ledger.verify_chain(tampered_session) is True

    # Intentionally corrupt b0 transcript hash
    chain = merkle_audit_ledger.get_session_chain(tampered_session)
    original_hash = chain[0].transcript_hash
    chain[0].transcript_hash = "deadbeef" * 8

    # Must fail validation and raise AuditTamperingDetectedError
    assert merkle_audit_ledger.verify_chain(tampered_session) is False
    with pytest.raises(AuditTamperingDetectedError):
        merkle_audit_ledger.assert_chain_integrity(tampered_session)

    # Restore
    chain[0].transcript_hash = original_hash


def test_mock_llm_latency_under_300ms():
    import time
    start = time.perf_counter()
    for _ in range(50):
        MockLLMService.evaluate("This is an urgent call from CBI Mumbai police regarding your passport and digital arrest.")
    elapsed = (time.perf_counter() - start) / 50.0
    # Average response must be strictly under 0.3s (300ms), typically < 1ms
    assert elapsed < 0.300, f"MockLLM evaluation too slow: {elapsed*1000:.2f}ms"
