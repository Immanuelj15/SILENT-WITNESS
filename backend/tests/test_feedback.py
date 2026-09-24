from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.models.database import init_db

init_db()
client = TestClient(app)

def test_user_feedback_submission():
    payload = {
        "call_id": "test_call_123",
        "user_label": "FALSE_ALARM",
        "notes": "Legitimate bank manager meeting confirmation."
    }
    res = client.post("/api/feedback", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "calibration" in data["calibrated_adjustment"].lower()
