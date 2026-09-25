"""
OTT Edition — Backend Test Suite.

Validates:
1. OTT Identity Engine (contact status, country code, call origin, account age)
2. OTT Trust Engine — fast-path override for screen-share + financial context
3. OTT Trust Engine — correct handling of legitimate international calls (no over-trigger)
4. OTT Trust Engine — video extortion fast-path override
5. OTT Trust Engine — APK/remote tool fast-path override
6. REST endpoint /api/ott/analyze (screen-share bank scam scenario)
7. REST endpoint /api/ott/analyze (legitimate family video call — no false positive)
8. Link/file scanner integration in OTT analyze
9. Chat-context link: phishing APK link correctly raises risk
10. OTT WebSocket /ws/ott-call basic handshake
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.ott_identity_engine import ott_identity_engine, OTTIdentityEngine
from backend.app.services.ott_trust_engine import ott_trust_engine, OTTTrustFusionEngine

client = TestClient(app)


# ─────────────────────────────────────────────────────────────
# Section A: OTT Identity Engine Tests
# ─────────────────────────────────────────────────────────────

class TestOTTIdentityEngine:

    def test_saved_contact_reduces_risk(self):
        """Saved contacts should significantly lower pre-call risk."""
        result = ott_identity_engine.analyze_caller(
            phone_number="+919876543210",
            is_saved_contact=True,
            contact_name="Mom",
            call_origin="KNOWN_CONTACT",
        )
        assert result["identity_risk_score"] < 20, (
            f"Saved known contact should have low risk, got {result['identity_risk_score']}"
        )

    def test_unsaved_contact_elevated_risk(self):
        """Unsaved number starting a call should be moderately elevated."""
        result = ott_identity_engine.analyze_caller(
            phone_number="+919876543210",
            is_saved_contact=False,
            call_origin="DIRECT_DIAL",
        )
        assert result["identity_risk_score"] >= 20

    def test_broadcast_origin_high_risk(self):
        """Call from broadcast link is a strong scam signal."""
        result = ott_identity_engine.analyze_caller(
            is_saved_contact=False,
            call_origin="BROADCAST",
        )
        assert result["identity_risk_score"] >= 40

    def test_very_new_account_high_risk(self):
        """Account created < 7 days ago should raise risk significantly."""
        result = ott_identity_engine.analyze_caller(
            is_saved_contact=False,
            call_origin="DIRECT_DIAL",
            account_age_days=3,
        )
        assert result["identity_risk_score"] >= 40

    def test_established_account_no_age_penalty(self):
        """Old established account should get no account-age risk penalty."""
        result = ott_identity_engine.analyze_caller(
            is_saved_contact=True,
            call_origin="KNOWN_CONTACT",
            account_age_days=730,
        )
        assert result["identity_risk_score"] < 15

    def test_country_code_soft_signal_only(self):
        """High-risk country code alone must NOT produce high-severity alert."""
        result = ott_identity_engine.analyze_caller(
            phone_number="+2349012345678",  # Nigeria
            is_saved_contact=True,   # BUT it's a saved contact
            call_origin="KNOWN_CONTACT",
            account_age_days=400,
        )
        # Even with Nigeria country code, saved contact trust should keep risk low
        assert result["identity_risk_score"] < 30, (
            "Country code alone (with saved contact) should not produce high risk. "
            f"Got {result['identity_risk_score']}"
        )

    def test_unfamiliar_country_code_unsaved_moderately_elevated(self):
        """Unfamiliar country code + unsaved contact = moderate combined signal."""
        result = ott_identity_engine.analyze_caller(
            phone_number="+2349012345678",  # Nigeria
            is_saved_contact=False,
            call_origin="DIRECT_DIAL",
            account_age_days=5,  # also very new
        )
        # Multiple signals should combine
        assert result["identity_risk_score"] >= 40

    def test_bank_impersonation_display_name(self):
        """Caller display name mimicking a bank should raise profile risk."""
        result = ott_identity_engine.analyze_caller(
            is_saved_contact=False,
            caller_display_name="SBI Bank Security",
            call_origin="DIRECT_DIAL",
        )
        assert result["signal_breakdown"]["profile_risk"] >= 15

    def test_unsolicited_link_before_call_elevated(self):
        """Unsolicited phishing link shared before call should raise risk."""
        result = ott_identity_engine.analyze_caller(
            is_saved_contact=False,
            has_unsolicited_link_before_call=True,
            call_origin="UNSOLICITED_CHAT",
        )
        assert result["identity_risk_score"] >= 50

    def test_honesty_note_present(self):
        """Identity engine must always return technical honesty note."""
        result = ott_identity_engine.analyze_caller()
        assert "honesty_note" in result
        assert len(result["honesty_note"]) > 20


# ─────────────────────────────────────────────────────────────
# Section B: OTT Trust Engine Fast-Path Override Tests
# ─────────────────────────────────────────────────────────────

class TestOTTTrustEngine:

    def test_screen_share_financial_context_fast_path(self):
        """Screen share active + OTP request must trigger fast-path critical override."""
        result = ott_trust_engine.compute_ott_trust_score(
            transcript="I am from SBI Bank. You need to tell me the OTP now to prevent blocking.",
            screen_share_active=True,
            otp_solicited=True,
        )
        assert result["fast_path_triggered"] is True
        assert result["ott_risk_score"] >= 90, (
            f"Screen-share + OTP must hit >=90 risk, got {result['ott_risk_score']}"
        )
        assert result["ott_trust_score"] <= 10

    def test_screen_share_coercion_in_transcript_fast_path(self):
        """Transcript demanding screen sharing with financial context must trigger fast-path."""
        result = ott_trust_engine.compute_ott_trust_score(
            transcript="Please share your screen and open your YONO bank app to verify your account.",
            screen_share_coercion_detected=True,
        )
        assert result["fast_path_triggered"] is True
        assert result["ott_risk_score"] >= 88

    def test_video_extortion_fast_path(self):
        """Video extortion pattern must trigger fast-path critical override."""
        result = ott_trust_engine.compute_ott_trust_score(
            transcript="I have recorded your video. Pay one lakh or I will send it to all your contacts.",
            video_extortion_pattern=True,
        )
        assert result["fast_path_triggered"] is True
        assert result["ott_risk_score"] >= 90

    def test_remote_access_tool_fast_path(self):
        """AnyDesk/remote access tool request must trigger fast-path override."""
        result = ott_trust_engine.compute_ott_trust_score(
            transcript="Please download AnyDesk and give me the 9-digit access code.",
            remote_access_tool_requested=True,
        )
        assert result["fast_path_triggered"] is True
        assert result["ott_risk_score"] >= 85

    def test_legitimate_international_family_call_no_fast_path(self):
        """Legitimate family call from abroad must NOT trigger fast-path override."""
        result = ott_trust_engine.compute_ott_trust_score(
            transcript="Hi mom, it's your son calling from London. How is everyone at home? Miss you all.",
            screen_share_active=False,
            video_extortion_pattern=False,
            ott_identity_risk=15.0,  # Slightly elevated for unfamiliar country code
            call_origin="KNOWN_CONTACT",
        )
        assert result["fast_path_triggered"] is False, (
            "Legitimate international family call must NOT trigger fast-path"
        )
        assert result["ott_risk_score"] < 40, (
            f"Legitimate call risk must be below 40, got {result['ott_risk_score']}"
        )

    def test_financial_context_detection(self):
        """Financial context detection must correctly identify OTP/banking references."""
        engine = OTTTrustFusionEngine()
        assert engine.detect_financial_context("Tell me the OTP now") is True
        assert engine.detect_financial_context("Send money via UPI") is True
        assert engine.detect_financial_context("How is the weather today?") is False

    def test_ott_signal_detection(self):
        """OTT-specific scam phrase patterns must be detected."""
        engine = OTTTrustFusionEngine()
        signals = engine.detect_ott_scam_signals(
            "Share your screen now and install this apk from the link I sent."
        )
        assert len(signals) >= 1

    def test_voice_weight_halved_for_broadcast_origin(self):
        """Voice risk contribution must be halved for broadcast-origin calls."""
        # Broadcast origin (impersonal) — voice deepfake weight should be halved
        result_broadcast = ott_trust_engine.compute_ott_trust_score(
            transcript="Hello this is your bank.",
            voice_risk=60.0,
            call_origin="BROADCAST",
        )
        # Direct 1:1 call — full voice weight
        result_direct = ott_trust_engine.compute_ott_trust_score(
            transcript="Hello this is your bank.",
            voice_risk=60.0,
            call_origin="DIRECT_DIAL",
        )
        # Broadcast should have lower voice contribution
        broadcast_voice = result_broadcast["attribution"]["voice_contribution"]
        direct_voice = result_direct["attribution"]["voice_contribution"]
        assert broadcast_voice < direct_voice, (
            "Broadcast-origin calls should have halved voice risk weight"
        )


# ─────────────────────────────────────────────────────────────
# Section C: REST Endpoint Tests
# ─────────────────────────────────────────────────────────────

class TestOTTRestEndpoint:

    def test_ott_analyze_screen_share_bank_scam(self):
        """Bank screen-share scam scenario must trigger fast-path at REST endpoint."""
        payload = {
            "text": "I am from your SBI bank security team. Please share your screen and open YONO banking app. Tell me the OTP you just received.",
            "channel": "WHATSAPP",
            "screen_share_active": True,
            "caller_context": {
                "is_saved_contact": False,
                "call_origin": "DIRECT_DIAL",
                "account_age_days": 5,
                "caller_display_name": "SBI Security",
            }
        }
        response = client.post("/api/ott/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["fast_path_triggered"] is True
        assert data["ott_risk_score"] >= 88
        assert data["ott_trust_score"] <= 12
        assert data["classification"] in ("CRITICAL", "HIGH_RISK")

    def test_ott_analyze_legitimate_family_call_no_false_positive(self):
        """Legitimate saved-contact family call must NOT produce high risk."""
        payload = {
            "text": "Hi it's your daughter calling from the UK. Everything is fine. Just wanted to hear your voice. How is dad doing?",
            "channel": "WHATSAPP",
            "screen_share_active": False,
            "caller_context": {
                "is_saved_contact": True,
                "contact_name": "Daughter UK",
                "call_origin": "KNOWN_CONTACT",
                "account_age_days": 1200,
                "is_video_call": True,
            }
        }
        response = client.post("/api/ott/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["fast_path_triggered"] is False
        assert data["ott_risk_score"] < 35, (
            f"Legitimate family call must be below 35 risk, got {data['ott_risk_score']}"
        )

    def test_ott_analyze_with_phishing_link(self):
        """Phishing link in chat must elevate OTT risk score."""
        payload = {
            "text": "Click this link to update your KYC and avoid account suspension.",
            "channel": "WHATSAPP",
            "links_in_chat": ["http://sbi-kyc-update.xyz/login"],
            "caller_context": {
                "is_saved_contact": False,
                "call_origin": "UNSOLICITED_CHAT",
            }
        }
        response = client.post("/api/ott/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["link_analysis"]["max_risk"] >= 40
        assert data["ott_risk_score"] >= 15  # Link risk at 0.10 weight; identity + link combined

    def test_ott_analyze_video_extortion(self):
        """Video extortion blackmail scenario must trigger critical fast-path."""
        payload = {
            "text": "I have a video recording of you. Pay 50000 rupees or I will send it to all your contacts on WhatsApp.",
            "channel": "WHATSAPP",
            "video_extortion_pattern": True,
            "caller_context": {
                "is_saved_contact": False,
                "call_origin": "DIRECT_DIAL",
                "is_video_call": True,
                "account_age_days": 2,
            }
        }
        response = client.post("/api/ott/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["fast_path_triggered"] is True
        assert data["ott_risk_score"] >= 88

    def test_ott_analyze_returns_identity_analysis(self):
        """Response must include structured identity_analysis breakdown."""
        payload = {
            "text": "Hello, is this available?",
            "channel": "WHATSAPP",
            "caller_context": {
                "is_saved_contact": False,
                "call_origin": "BROADCAST",
            }
        }
        response = client.post("/api/ott/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "identity_analysis" in data
        assert data["identity_analysis"] is not None
        assert "identity_risk_score" in data["identity_analysis"]

    def test_ott_analyze_apk_download_scenario(self):
        """AnyDesk/APK download request must be flagged as critical."""
        payload = {
            "text": "Your SIM card is deactivating. Please download AnyDesk app and give me the 9-digit code.",
            "channel": "WHATSAPP",
            "caller_context": {
                "is_saved_contact": False,
                "call_origin": "DIRECT_DIAL",
            }
        }
        response = client.post("/api/ott/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        # AnyDesk keyword via NLP contributes significantly
        assert data["ott_risk_score"] >= 50


# ─────────────────────────────────────────────────────────────
# Section D: OTT WebSocket Basic Tests
# ─────────────────────────────────────────────────────────────

class TestOTTWebSocket:

    def test_ott_websocket_handshake(self):
        """WebSocket /ws/ott-call must send OTT_SESSION_INIT on connect."""
        with client.websocket_connect("/ws/ott-call") as ws:
            init_msg = ws.receive_json()
            assert init_msg["type"] == "OTT_SESSION_INIT"
            assert init_msg["status"] == "CONNECTED"
            assert "sessionId" in init_msg
            assert "capabilities" in init_msg

    def test_ott_websocket_session_start(self):
        """SESSION_START should trigger identity_assessed event."""
        with client.websocket_connect("/ws/ott-call") as ws:
            ws.receive_json()  # consume handshake
            ws.send_json({
                "type": "SESSION_START",
                "context": {
                    "is_saved_contact": False,
                    "call_origin": "BROADCAST",
                    "account_age_days": 3,
                    "phone_number": "+2349012345678",
                }
            })
            event = ws.receive_json()
            assert event.get("event") == "identity_assessed"
            assert "identity_risk_score" in event["data"]
            assert event["data"]["identity_risk_score"] >= 40

    def test_ott_websocket_screen_share_on_critical_alert(self):
        """SCREEN_SHARE_ON triggers fast-path critical alert."""
        with client.websocket_connect("/ws/ott-call") as ws:
            init_msg = ws.receive_json()  # consume handshake
            assert init_msg["type"] == "OTT_SESSION_INIT"

            # Trigger SCREEN_SHARE_ON — cold screen-share / early coerce triggers fast path
            ws.send_json({"type": "SCREEN_SHARE_ON"})

            # Message 1: screen_share_activated
            msg1 = ws.receive_json()
            assert msg1.get("event") == "screen_share_activated"
            assert msg1["data"]["screen_share_active"] is True
            assert msg1["data"]["fast_path_override"] is not None

            # Message 2: FAST_PATH_CRITICAL_ALERT
            msg2 = ws.receive_json()
            assert msg2.get("type") == "FAST_PATH_CRITICAL_ALERT"
            assert msg2["alert"]["severity"] == "CRITICAL"
            assert msg2["alert"]["riskScore"] >= 88
            assert "stop_sharing" in [a["id"] for a in msg2["alert"]["emergency_actions"]]
