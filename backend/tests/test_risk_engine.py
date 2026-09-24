import pytest
from backend.app.risk.engine import DeterministicRiskEngine
from backend.app.models.schemas import EvidenceItem

def test_risk_weights_normalization():
    engine = DeterministicRiskEngine(
        weight_voice=0.35,
        weight_social_eng=0.25,
        weight_fraud_intent=0.20,
        weight_identity=0.10,
        weight_threat=0.10
    )
    total_w = engine.w_voice + engine.w_social + engine.w_intent + engine.w_identity + engine.w_threat
    assert pytest.approx(total_w, 0.001) == 1.0

def test_safe_conversation_scoring():
    engine = DeterministicRiskEngine()
    risk, trust, breakdown, classification, recommendation, actions, easy_summary = engine.compute_risk(
        voice_risk=10.0,
        social_engineering_risk=0.0,
        fraud_intent_risk=0.0,
        identity_risk=0.0,
        threat_risk=0.0,
        evidence_items=[]
    )
    assert risk <= 30
    assert trust >= 70
    assert classification == "SAFE"
    assert "SAFE" in recommendation

def test_high_risk_otp_urgency_override():
    engine = DeterministicRiskEngine()
    evidence = [
        EvidenceItem(exact_phrase="tell me the otp", detected_tag="OTP Solicitation", is_grounded_in_transcript=True, context_note=""),
        EvidenceItem(exact_phrase="immediately", detected_tag="Urgency", is_grounded_in_transcript=True, context_note="")
    ]
    risk, trust, breakdown, classification, recommendation, actions, easy_summary = engine.compute_risk(
        voice_risk=20.0,
        social_engineering_risk=80.0,
        fraud_intent_risk=95.0,
        identity_risk=50.0,
        threat_risk=70.0,
        evidence_items=evidence
    )
    assert risk >= 85
    assert trust <= 15
    assert classification == "LIKELY_SCAM"
    assert "STOP AND VERIFY" in recommendation
    assert any("OTP" in a for a in actions)
