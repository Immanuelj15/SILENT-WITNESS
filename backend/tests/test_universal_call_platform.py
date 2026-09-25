"""
Automated Test Suite for Universal Call Safety Platform:
- Channel Abstraction & Capabilities
- Platform Adapters (SIM call screening, WhatsApp restrictions)
- Screen-Sharing Scam Detection Engine
- Video Call Analysis & Extortion Detection Engine
- URL / Suspicious Link / APK Phishing Analyzer
- Multi-Agent Integration with Screen & Video Agents
"""

import pytest
from backend.app.communication.channel import (
    CommunicationChannel,
    CapabilityStatus,
    get_default_capabilities_for_channel
)
from backend.app.communication.adapters import get_platform_adapter, SimCallAdapter, WhatsAppAdapter
from backend.app.services.screen_share_engine import screen_share_engine
from backend.app.services.video_engine import video_analysis_engine
from backend.app.services.url_analyzer import url_analyzer
from backend.app.agents.supervisor_agent import SupervisorAgent


def test_channel_capabilities_technical_honesty():
    # WhatsApp must be platform restricted for direct audio interception
    wa_caps = get_default_capabilities_for_channel(CommunicationChannel.WHATSAPP)
    assert wa_caps.audio_analysis == CapabilityStatus.PLATFORM_RESTRICTED
    assert wa_caps.screen_share_detection == CapabilityStatus.ACTIVE

    # Own VoIP mode has full zero-restriction access
    voip_caps = get_default_capabilities_for_channel(CommunicationChannel.OWN_VOIP)
    assert voip_caps.audio_analysis == CapabilityStatus.ACTIVE
    assert voip_caps.video_deepfake_analysis == CapabilityStatus.ACTIVE


def test_sim_call_adapter_screening():
    adapter = SimCallAdapter()
    res = adapter.screen_incoming_call("+91140999999")
    assert res["action"] in ["BLOCK", "SILENCE"]

    safe_res = adapter.screen_incoming_call("+919876500000")
    assert safe_res["action"] == "ALLOW"


def test_screen_share_scam_detection():
    # Lethal sequence: AnyDesk + banking app + OTP
    transcript = "Sir please install AnyDesk on your phone, open your bank app and share your screen so I can verify the OTP."
    res = screen_share_engine.analyze_text(transcript)

    assert res["detected"] is True
    assert res["risk_level"] == "CRITICAL"
    assert res["screen_share_risk"] >= 85
    assert "COMPLETE_DEVICE_CONTROL" in res["target_assets_at_risk"]
    assert "STOP SCREEN SHARING" in res["recommended_action"]


def test_video_extortion_blackmail_detection():
    # Video extortion pattern: camera request + recording threat + payment demand
    transcript = "Turn on your camera now. I have recorded your screen and video, pay 50000 immediately or I will send to your family and friends."
    res = video_analysis_engine.analyze_video_context(transcript)

    assert res["is_extortion_detected"] is True
    assert res["visualRisk"] >= 85.0
    assert res["category"] == "VIDEO_EXTORTION"
    assert "DO NOT PAY" in res["warning"]


def test_video_deepfake_lip_sync_artifacts():
    frame_meta = {
        "lip_sync_mismatch": True,
        "temporal_jitter": 0.75,
        "sudden_face_replacement": False
    }
    res = video_analysis_engine.analyze_video_context("Routine conversation", frame_meta)
    assert res["visualRisk"] >= 50.0
    assert "lip_sync_inconsistency" in res["signals"]


def test_url_analyzer_phishing_and_apk():
    # Lookalike banking domain
    lookalike_res = url_analyzer.analyze_url("https://sbi-login-verify-account.top/update")
    assert lookalike_res["is_malicious_suspected"] is True
    assert any("Lookalike" in r for r in lookalike_res["reasons"])

    # Direct APK download
    apk_res = url_analyzer.analyze_url("https://secure-banking-support.com/app/bank-update.apk")
    assert apk_res["is_malicious_suspected"] is True
    assert any("APK" in r for r in apk_res["reasons"])

    # Shortened URL
    short_res = url_analyzer.analyze_url("https://bit.ly/sbi-urgent")
    assert any("shortener" in r.lower() for r in short_res["reasons"])


def test_supervisor_agent_with_screen_and_video():
    supervisor = SupervisorAgent()
    transcript = "Please share your screen and open the AnyDesk app right now to stop account deactivation."
    
    result = supervisor.process_conversation(
        transcript=transcript,
        channel="WHATSAPP"
    )

    assert result.riskScore >= 80
    assert result.trustScore <= 20
    assert result.screenShareAnalysis is not None
    assert result.screenShareAnalysis["is_screen_share_demanded"] is True
    assert any("Screen-Sharing" in rf for rf in result.riskFactors)
    assert "STOP SCREEN SHARING IMMEDIATELY" in result.actions
