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
    assert data["classification"] in ["HIGH_RISK", "LIKELY_SCAM"]
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
