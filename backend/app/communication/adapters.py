"""
Platform Adapters for Universal Communication Call Safety.

Implements Section 6 Platform Adapter Architecture without hardcoding WhatsApp or SIM logic.
Every adapter reports its technical status, restrictions, and capabilities honestly.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import time

from backend.app.communication.channel import (
    CommunicationChannel,
    CapabilityStatus,
    PlatformCapabilityMatrix,
    get_default_capabilities_for_channel
)


class BasePlatformAdapter(ABC):
    def __init__(self, channel: CommunicationChannel, platform_name: str):
        self.channel = channel
        self.platform_name = platform_name
        self.capabilities = get_default_capabilities_for_channel(channel)
        self.is_monitoring = False
        self.current_session_id: Optional[str] = None
        self.call_state = "IDLE"  # IDLE, RINGING, ACTIVE, DISCONNECTED

    @abstractmethod
    def initialize(self, config: Optional[Dict[str, Any]] = None) -> bool:
        """Initialize adapter hardware/service connections."""
        pass

    def get_platform_status(self) -> Dict[str, Any]:
        """Returns adapter status and honest capability restrictions."""
        return {
            "channel": self.channel.value,
            "platform_name": self.platform_name,
            "call_state": self.call_state,
            "is_monitoring": self.is_monitoring,
            "capabilities": self.capabilities.to_dict()
        }

    def get_call_state(self) -> str:
        return self.call_state

    def get_available_signals(self) -> List[str]:
        signals = []
        if self.capabilities.caller_screening == CapabilityStatus.ACTIVE:
            signals.append("CALLER_ID_REPUTATION")
        if self.capabilities.audio_analysis == CapabilityStatus.ACTIVE:
            signals.append("AUDIO_STREAM")
            signals.append("VOICE_DEEPFAKE")
            signals.append("SPEECH_TO_TEXT")
        if self.capabilities.video_deepfake_analysis == CapabilityStatus.ACTIVE:
            signals.append("VIDEO_FRAMES")
            signals.append("FACE_TEMPORAL_CONSISTENCY")
        if self.capabilities.screen_share_detection in [CapabilityStatus.ACTIVE, CapabilityStatus.LIMITED]:
            signals.append("SCREEN_SHARE_COERCION_DETECTION")
        return signals

    def start_monitoring(self, session_id: str, call_metadata: Optional[Dict[str, Any]] = None) -> bool:
        self.current_session_id = session_id
        self.is_monitoring = True
        self.call_state = "ACTIVE"
        return True

    def stop_monitoring(self) -> bool:
        self.is_monitoring = False
        self.call_state = "IDLE"
        self.current_session_id = None
        return True

    def send_safety_event(self, event_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "session_id": self.current_session_id,
            "channel": self.channel.value,
            "timestamp": time.time(),
            "event_type": event_type,
            "payload": payload
        }


class SimCallAdapter(BasePlatformAdapter):
    """
    Adapter for Android CallScreeningService & Cellular Telephony.
    Performs pre-call screening and reputation scoring.
    """
    def __init__(self):
        super().__init__(CommunicationChannel.SIM_CALL, "android_telecom_call_screening")

    def initialize(self, config: Optional[Dict[str, Any]] = None) -> bool:
        return True

    def screen_incoming_call(self, phone_number: str) -> Dict[str, Any]:
        """
        Executes Mode A SIM Call screening pipeline:
        Incoming SIM Call -> CallScreeningService -> Caller Number -> Verification -> Initial Risk -> Allow/Silence/Block
        """
        from backend.app.services.caller_reputation import caller_reputation_service
        reputation = caller_reputation_service.evaluate_caller(phone_number)
        
        should_block = reputation.get("prior_risk_penalty", 0) >= 30 or reputation.get("risk_tier") == "SUSPECTED_ROBOCALL"
        should_silence = reputation.get("prior_risk_penalty", 0) >= 15

        return {
            "phone_number": phone_number,
            "reputation": reputation,
            "action": "BLOCK" if should_block else "SILENCE" if should_silence else "ALLOW",
            "warning": (
                "High-risk spam or spoofed cellular caller ID pattern detected."
                if should_block else
                "Unknown caller. Baseline zero-trust screening active."
            )
        }


class WhatsAppAdapter(BasePlatformAdapter):
    """
    Adapter for third-party messaging calls (WhatsApp, Telegram, Signal).
    Strictly technical honest: Does NOT claim direct VoIP audio interception without user opt-in.
    Monitors notification events, screen-sharing coercions, and accessibility signals.
    """
    def __init__(self):
        super().__init__(CommunicationChannel.WHATSAPP, "whatsapp_online_call_companion")

    def initialize(self, config: Optional[Dict[str, Any]] = None) -> bool:
        return True

    def detect_screen_share_risk(self, conversational_cues: List[str]) -> Dict[str, Any]:
        from backend.app.services.screen_share_engine import screen_share_engine
        return screen_share_engine.analyze_text(" ".join(conversational_cues))


class VoIPAdapter(BasePlatformAdapter):
    """
    Adapter for generic enterprise VoIP / SIP trunks.
    """
    def __init__(self):
        super().__init__(CommunicationChannel.VOIP, "enterprise_sip_voip")

    def initialize(self, config: Optional[Dict[str, Any]] = None) -> bool:
        return True


class WebRTCAdapter(BasePlatformAdapter):
    """
    Adapter for in-browser / WebRTC peer-to-peer calls.
    """
    def __init__(self):
        super().__init__(CommunicationChannel.WEBRTC, "webrtc_peer_call")

    def initialize(self, config: Optional[Dict[str, Any]] = None) -> bool:
        return True


class BrowserCallAdapter(BasePlatformAdapter):
    """
    Adapter for browser-based WebRTC microphone & media streams.
    """
    def __init__(self):
        super().__init__(CommunicationChannel.BROWSER_CALL, "browser_mediastream_client")

    def initialize(self, config: Optional[Dict[str, Any]] = None) -> bool:
        return True


class OwnVoIPAdapter(BasePlatformAdapter):
    """
    Silent Witness Secure Call mode: Full direct media track access.
    Demonstrates zero-restriction real-time safety inspection across audio, video, and screen.
    """
    def __init__(self):
        super().__init__(CommunicationChannel.OWN_VOIP, "silent_witness_secure_voip")

    def initialize(self, config: Optional[Dict[str, Any]] = None) -> bool:
        return True


# Registry of platform adapters
_ADAPTERS: Dict[CommunicationChannel, BasePlatformAdapter] = {
    CommunicationChannel.SIM_CALL: SimCallAdapter(),
    CommunicationChannel.WHATSAPP: WhatsAppAdapter(),
    CommunicationChannel.VOIP: VoIPAdapter(),
    CommunicationChannel.WEBRTC: WebRTCAdapter(),
    CommunicationChannel.BROWSER_CALL: BrowserCallAdapter(),
    CommunicationChannel.OWN_VOIP: OwnVoIPAdapter(),
    CommunicationChannel.VIDEO_CALL: OwnVoIPAdapter(),
}


def get_platform_adapter(channel: CommunicationChannel) -> BasePlatformAdapter:
    return _ADAPTERS.get(channel, _ADAPTERS[CommunicationChannel.BROWSER_CALL])
