"""
Unit tests for Tier 2 and Tier 3 services:
- CallerReputationService
- ScriptFingerprintEngine
- EmotionEngine
- SessionAuditLedger (Tamper-evident hash chain)
- CoachingEngine
- MultiModalContextEngine
"""

import pytest
from backend.app.services.caller_reputation import caller_reputation_service, RiskTier
from backend.app.services.script_fingerprint import script_fingerprint_engine
from backend.app.services.emotion_engine import emotion_engine
from backend.app.services.audit_logger import SessionAuditLedger
from backend.app.services.coaching import coaching_engine
from backend.app.services.multimodal_context import multimodal_engine


def test_caller_reputation_known_contact():
    result = caller_reputation_service.evaluate_caller(
        phone_number="+91 98765 12345",
        is_in_contacts=True,
        contact_name="Dad"
    )
    assert result["risk_tier"] == RiskTier.KNOWN_CONTACT
    assert result["reputation_score"] == 95
    assert result["prior_risk_penalty"] == 0
    assert result["baseline_trust_score"] == 95


def test_caller_reputation_verified_business():
    result = caller_reputation_service.evaluate_caller(
        phone_number="+9118001234",
        is_in_contacts=False
    )
    assert result["risk_tier"] == RiskTier.VERIFIED_BUSINESS
    assert "State Bank of India" in result["label"]
    assert result["is_spoof_risk"] is True  # Flagged because bank numbers can be spoofed


def test_caller_reputation_suspected_robocall():
    result = caller_reputation_service.evaluate_caller(
        phone_number="+91140999999",
        is_in_contacts=False
    )
    assert result["risk_tier"] == RiskTier.SUSPECTED_ROBOCALL
    assert result["prior_risk_penalty"] >= 20
    assert result["baseline_trust_score"] <= 60


def test_script_fingerprint_digital_arrest():
    turns = [
        "This is Mumbai Police Customs Department.",
        "A parcel in your name was seized containing illegal narcotics and fake passports.",
        "You are placed under immediate digital arrest and continuous Skype surveillance."
    ]
    res = script_fingerprint_engine.match_transcript(turns)
    assert res["matched"] is True
    assert res["script_id"] == "SCRIPT_DIGITAL_ARREST"
    assert res["similarity_score"] >= 0.5
    assert len(res["detected_milestones"]) >= 2
    assert "digital arrest" in res["safe_exit_advice"].lower()


def test_script_fingerprint_bank_kyc():
    turns = [
        "Your SBI YONO account will be blocked within 24 hours.",
        "Please provide your PAN card and the 6-digit OTP sent to your mobile."
    ]
    res = script_fingerprint_engine.match_transcript(turns)
    assert res["matched"] is True
    assert res["script_id"] == "SCRIPT_BANK_KYC_BLOCK"
    assert res["similarity_score"] >= 0.4


def test_emotion_engine_coercion_and_user_stress():
    turns = [
        {"speaker": "caller", "text": "Listen to me! You are in huge trouble. Police will arrest you immediately!"},
        {"speaker": "user", "text": "Wait, uh, please don't arrest me, I'm not sure what happened, let me check..."},
        {"speaker": "caller", "text": "Keep quiet and do not discuss with family! Disconnect from wifi now!"}
    ]
    res = emotion_engine.analyze_turns(turns)
    assert res["emotional_manipulation_score"] >= 50
    assert res["vector_breakdown"]["fear"] > 0
    assert res["vector_breakdown"]["isolation"] > 0
    assert res["user_hesitation_detected"] is True
    assert res["user_stress_score"] > 0


def test_audit_ledger_integrity_and_tamper_detection():
    ledger = SessionAuditLedger("session-test-101")
    
    # Add events
    b1 = ledger.add_block("CALL_CONNECTED", {"caller": "Unknown"})
    b2 = ledger.add_block("CREDENTIAL_DEMAND", {"phrase": "Tell me OTP"})
    b3 = ledger.add_block("RISK_EVALUATION", {"trustScore": 12, "riskScore": 88})

    # Verify initial integrity
    check = ledger.verify_integrity()
    assert check["valid"] is True
    assert check["total_blocks"] == 4  # Genesis + 3 blocks
    assert check["tamper_evident"] is True

    # Tamper with block 2 data
    ledger.chain[2].data["phrase"] = "Tampered text!"
    corrupted_check = ledger.verify_integrity()
    assert corrupted_check["valid"] is False
    assert corrupted_check["tampered_index"] == 2


def test_coaching_engine_strategies():
    otp_coaching = coaching_engine.get_coaching_prompt(
        intent_type="CREDENTIAL_DEMAND",
        risk_level="CRITICAL",
        scam_category="BANKING_OTP"
    )
    assert otp_coaching["priority"] == "CRITICAL"
    assert "OTP" in otp_coaching["recommended_script"]
    assert "employee ID" in otp_coaching["trap_question"]

    police_coaching = coaching_engine.get_coaching_prompt(
        intent_type="THREAT",
        risk_level="HIGH_RISK",
        scam_category="DIGITAL_ARREST"
    )
    assert "legal counsel" in police_coaching["recommended_script"]
    assert "police station" in police_coaching["trap_question"]


def test_multimodal_context_correlation():
    recent_sms = [
        {
            "sender": "VK-SBIINB",
            "body": "Dear customer, your SBI YONO account blocked today. Update PAN immediately click bit.ly/sbi-pan",
            "timestamp": 1727240000.0
        }
    ]
    call_transcript = "Sir your SBI YONO account has been blocked because PAN is not updated."
    correlation = multimodal_engine.correlate_sms_with_call(recent_sms, call_transcript)
    assert correlation["correlated"] is True
    assert correlation["risk_elevation"] == 25
    assert "sbi" in [t.lower() for t in correlation["matched_lure"]["shared_entities"]]
