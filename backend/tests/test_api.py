import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.models.database import init_db

# Ensure tables exist for test client
init_db()
client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "Silent Witness" in data["service"]

def test_api_analyze_text_scam():
    payload = {
        "text": "I am calling from your bank. Your account will be blocked today. Tell me the OTP immediately."
    }
    res = client.post("/api/analyze-text", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["classification"] in ["HIGH_RISK", "LIKELY_SCAM", "CRITICAL"]
    assert data["riskScore"] >= 75
    assert data["trustScore"] <= 25
    assert len(data["evidence"]) > 0

def test_api_analyze_text_safe():
    payload = {
        "text": "Hi Mom, I am on my way home from college, see you for dinner."
    }
    res = client.post("/api/analyze-text", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["classification"] == "SAFE"
    assert data["trustScore"] >= 70

def test_api_history_and_stats():
    res_stats = client.get("/api/stats")
    assert res_stats.status_code == 200
    assert "total_calls" in res_stats.json()

    res_history = client.get("/api/history")
    assert res_history.status_code == 200
    assert isinstance(res_history.json(), list)

def test_api_demo_scenarios():
    res = client.get("/api/demo/scenario")
    assert res.status_code == 200
    scenarios = res.json()
    assert len(scenarios) >= 3
    assert any(s["id"] == "bank_otp_scam" for s in scenarios)

def test_api_knowledge_base():
    res = client.get("/api/knowledge-base")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] >= 15
    assert any(c["category"] == "BANKING_OTP" for c in data["categories"])

    res_cat = client.get("/api/knowledge-base/BANKING_OTP")
    assert res_cat.status_code == 200
    assert res_cat.json()["category"] == "BANKING_OTP"

def test_api_identity_verification():
    payload = {
        "claimedOrg": "State Bank of India",
        "transcript": "Please share your 6-digit OTP right now to unblock account."
    }
    res = client.post("/api/identity/verify", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["verificationStatus"] == "CONTRADICTED"
    assert len(data["contradictions"]) > 0

def test_api_privacy_settings_and_deletion():
    # Test GET privacy
    res = client.get("/api/privacy/settings")
    assert res.status_code == 200
    assert "audioStorageEnabled" in res.json()

    # Test PUT privacy
    res_put = client.put("/api/privacy/settings", json={"retentionPeriodDays": 14})
    assert res_put.status_code == 200
    assert res_put.json()["settings"]["retentionPeriodDays"] == 14

    # Test DELETE data
    res_del = client.delete("/api/privacy/data")
    assert res_del.status_code == 200
    assert res_del.json()["success"] is True

def test_api_evaluation_metrics():
    res = client.get("/api/evaluation/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "accuracy" in data
    assert "precision" in data
    assert "recall" in data
    assert "confusion_matrix" in data

def test_api_analysis_report_and_timeline():
    # Analyze text first
    payload = {"text": "I am from State Bank. Your account will be blocked. Tell me the OTP immediately."}
    res = client.post("/api/analyze-text", json=payload)
    assert res.status_code == 200
    call_id = res.json()["id"]

    # Test timeline
    res_timeline = client.get(f"/api/analysis/{call_id}/timeline")
    assert res_timeline.status_code == 200
    assert "timeline" in res_timeline.json()

    # Test intent chain
    res_chain = client.get(f"/api/analysis/{call_id}/intent-chain")
    assert res_chain.status_code == 200
    assert "intentChain" in res_chain.json()

    # Test report
    res_rep = client.get(f"/api/analysis/{call_id}/report")
    assert res_rep.status_code == 200
    assert "callSummary" in res_rep.json()
    assert "majorRiskSignals" in res_rep.json()
