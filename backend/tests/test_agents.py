import pytest
from backend.app.agents.scam_agent import ScamAgent
from backend.app.agents.intent_agent import IntentAgent
from backend.app.agents.identity_agent import IdentityAgent
from backend.app.agents.evidence_agent import EvidenceAgent
from backend.app.agents.supervisor_agent import SupervisorAgent

def test_scam_agent_urgency_detection():
    agent = ScamAgent()
    res = agent.analyze("Your account will be blocked today within 10 minutes immediately.")
    assert res["scam_risk"] > 40
    assert "Urgency" in res["detected_tactics"] or "Account Suspension Threat" in res["detected_tactics"]
    assert len(res["proposed_evidence"]) > 0

def test_intent_agent_credential_demand():
    agent = IntentAgent()
    res = agent.analyze("Please share the OTP verification code sent to your mobile.")
    assert res["fraud_intent_score"] >= 80
    assert any("OTP" in d for d in res["demands"])

def test_identity_agent_unverified_claim():
    agent = IdentityAgent()
    res = agent.analyze("Hello, this is Inspector Verma calling from Mumbai Cyber Crime Branch.")
    assert res["is_verified"] is False  # Never verified without external cryptographic auth
    assert "Law Enforcement Officer" in res["claimed_identity"]
    assert res["identity_risk_score"] >= 70

def test_evidence_agent_filters_hallucinations():
    agent = EvidenceAgent()
    transcript = "Hello, your package is arriving this afternoon."
    candidates = [
        {"phrase": "package is arriving", "tag": "Delivery Info", "note": ""},
        {"phrase": "share your bank password", "tag": "Credential Solicitation", "note": ""} # Not in transcript
    ]
    grounded, rejected = agent.ground_evidence(candidates, transcript)
    assert len(grounded) == 1
    assert grounded[0].exact_phrase == "package is arriving"
    assert len(rejected) == 1
    assert "password" in rejected[0]

def test_supervisor_agent_bank_otp_scam():
    supervisor = SupervisorAgent()
    text = "I am calling from your bank. Your account will be blocked today. Tell me the OTP immediately."
    res = supervisor.process_conversation(text)
    assert res.classification in ["HIGH_RISK", "LIKELY_SCAM"]
    assert res.trustScore <= 20
    assert any("OTP" in f for f in res.riskFactors)
    assert "STOP AND VERIFY" in res.recommendation
