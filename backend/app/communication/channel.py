"""
Universal Communication Channel Abstraction and Platform Capability Model.

Defines supported channels across SIM calls, online messaging calls (WhatsApp-style),
VoIP, WebRTC, in-app calls, and video calls.
Adheres strictly to Section 2: Technical Honesty regarding platform audio/screen access restrictions.
"""

from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class CommunicationChannel(str, Enum):
    SIM_CALL = "SIM_CALL"
    WHATSAPP = "WHATSAPP"
    VOIP = "VOIP"
    WEBRTC = "WEBRTC"
    VIDEO_CALL = "VIDEO_CALL"
    BROWSER_CALL = "BROWSER_CALL"
    OWN_VOIP = "OWN_VOIP"
    RECORDED_AUDIO = "RECORDED_AUDIO"
    RECORDED_VIDEO = "RECORDED_VIDEO"


class CapabilityStatus(str, Enum):
    ACTIVE = "ACTIVE"
    LIMITED = "LIMITED"
    USER_AUTHORIZATION_REQUIRED = "USER_AUTHORIZATION_REQUIRED"
    PLATFORM_RESTRICTED = "PLATFORM_RESTRICTED"
    UNAVAILABLE = "UNAVAILABLE"


class PlatformCapabilityMatrix(BaseModel):
    caller_screening: CapabilityStatus = CapabilityStatus.ACTIVE
    caller_id_metadata: CapabilityStatus = CapabilityStatus.ACTIVE
    audio_analysis: CapabilityStatus = CapabilityStatus.ACTIVE
    speech_to_text: CapabilityStatus = CapabilityStatus.ACTIVE
    voice_authenticity: CapabilityStatus = CapabilityStatus.ACTIVE
    video_deepfake_analysis: CapabilityStatus = CapabilityStatus.UNAVAILABLE
    screen_share_detection: CapabilityStatus = CapabilityStatus.ACTIVE
    full_conversation_analysis: CapabilityStatus = CapabilityStatus.ACTIVE
    notes: List[str] = Field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "caller_screening": self.caller_screening.value,
            "caller_id_metadata": self.caller_id_metadata.value,
            "audio_analysis": self.audio_analysis.value,
            "speech_to_text": self.speech_to_text.value,
            "voice_authenticity": self.voice_authenticity.value,
            "video_deepfake_analysis": self.video_deepfake_analysis.value,
            "screen_share_detection": self.screen_share_detection.value,
            "full_conversation_analysis": self.full_conversation_analysis.value,
            "notes": self.notes
        }


def get_default_capabilities_for_channel(channel: CommunicationChannel) -> PlatformCapabilityMatrix:
    """
    Returns realistic, technically honest capabilities per channel.
    Never claims unrestricted audio capture for third-party encrypted apps.
    """
    if channel == CommunicationChannel.SIM_CALL:
        return PlatformCapabilityMatrix(
            caller_screening=CapabilityStatus.ACTIVE,
            caller_id_metadata=CapabilityStatus.ACTIVE,
            audio_analysis=CapabilityStatus.LIMITED,  # In-call cellular audio requires accessibility / OEM bridge
            speech_to_text=CapabilityStatus.LIMITED,
            voice_authenticity=CapabilityStatus.LIMITED,
            video_deepfake_analysis=CapabilityStatus.UNAVAILABLE,
            screen_share_detection=CapabilityStatus.UNAVAILABLE,
            full_conversation_analysis=CapabilityStatus.LIMITED,
            notes=[
                "Android CallScreeningService active: Caller ID reputation and blocking operational.",
                "In-call audio stream restricted by modern Android security sandbox without user accessibility tap."
            ]
        )
    elif channel == CommunicationChannel.WHATSAPP:
        return PlatformCapabilityMatrix(
            caller_screening=CapabilityStatus.LIMITED,
            caller_id_metadata=CapabilityStatus.LIMITED,
            audio_analysis=CapabilityStatus.PLATFORM_RESTRICTED,
            speech_to_text=CapabilityStatus.PLATFORM_RESTRICTED,
            voice_authenticity=CapabilityStatus.PLATFORM_RESTRICTED,
            video_deepfake_analysis=CapabilityStatus.LIMITED,
            screen_share_detection=CapabilityStatus.ACTIVE,  # Screen share requests detected via text/accessibility or user opt-in
            full_conversation_analysis=CapabilityStatus.LIMITED,
            notes=[
                "WhatsApp end-to-end encrypted audio cannot be intercepted directly.",
                "Protection operates via OS accessibility events, notification screening, screen-share warning overlays, and user-shared audio."
            ]
        )
    elif channel == CommunicationChannel.VIDEO_CALL:
        return PlatformCapabilityMatrix(
            caller_screening=CapabilityStatus.LIMITED,
            caller_id_metadata=CapabilityStatus.LIMITED,
            audio_analysis=CapabilityStatus.ACTIVE,
            speech_to_text=CapabilityStatus.ACTIVE,
            voice_authenticity=CapabilityStatus.ACTIVE,
            video_deepfake_analysis=CapabilityStatus.ACTIVE,
            screen_share_detection=CapabilityStatus.ACTIVE,
            full_conversation_analysis=CapabilityStatus.ACTIVE,
            notes=[
                "Video frame sampling active for face temporal consistency and lip-sync artifact inspection.",
                "Extortion lure pattern recognition active."
            ]
        )
    elif channel in [CommunicationChannel.OWN_VOIP, CommunicationChannel.WEBRTC, CommunicationChannel.BROWSER_CALL]:
        return PlatformCapabilityMatrix(
            caller_screening=CapabilityStatus.ACTIVE,
            caller_id_metadata=CapabilityStatus.ACTIVE,
            audio_analysis=CapabilityStatus.ACTIVE,
            speech_to_text=CapabilityStatus.ACTIVE,
            voice_authenticity=CapabilityStatus.ACTIVE,
            video_deepfake_analysis=CapabilityStatus.ACTIVE,
            screen_share_detection=CapabilityStatus.ACTIVE,
            full_conversation_analysis=CapabilityStatus.ACTIVE,
            notes=[
                "Silent Witness Secure VoIP/WebRTC call mode: Full direct media track access for real-time safety inspection.",
                "Zero platform restrictions; all AI security agents operational."
            ]
        )
    else:  # Recorded / fallback
        return PlatformCapabilityMatrix(
            caller_screening=CapabilityStatus.UNAVAILABLE,
            caller_id_metadata=CapabilityStatus.LIMITED,
            audio_analysis=CapabilityStatus.ACTIVE,
            speech_to_text=CapabilityStatus.ACTIVE,
            voice_authenticity=CapabilityStatus.ACTIVE,
            video_deepfake_analysis=CapabilityStatus.ACTIVE,
            screen_share_detection=CapabilityStatus.ACTIVE,
            full_conversation_analysis=CapabilityStatus.ACTIVE,
            notes=[
                "Post-call forensic debrief mode: Processing recorded audio/video artifact."
            ]
        )


class CallSessionMetadata(BaseModel):
    session_id: str
    channel: CommunicationChannel = CommunicationChannel.SIM_CALL
    platform: str = "android_telecom"
    caller_number: Optional[str] = None
    caller_name: Optional[str] = None
    is_video_enabled: bool = False
    is_screen_share_active: bool = False
    analysis_mode: str = "REAL_TIME"
    capabilities: PlatformCapabilityMatrix = Field(default_factory=lambda: get_default_capabilities_for_channel(CommunicationChannel.SIM_CALL))
