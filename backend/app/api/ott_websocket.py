"""
OTT WebSocket Session Handler — WhatsApp/Telegram/VoIP Real-Time Protection.

Dedicated WebSocket endpoint for OTT call sessions. Accepts:
  - Audio chunks (base64 PCM/WAV)
  - Text/transcript chunks
  - Screen-share state events (on/off)
  - Video frame metadata events (no raw frames stored)
  - App-layer identity signals (contact status, account age, country code, call origin)
  - Chat-context events (link shared, file shared)

Fast-path override: screen_share_active + financial/credential context
→ INSTANT critical alert + "Stop Sharing Now" action, bypassing gradual scoring.
"""

import json
import base64
import uuid
import datetime
import re
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.app.agents.supervisor_agent import SupervisorAgent
from backend.app.audio.deepfake_detector import VoiceDeepfakeDetector
from backend.app.audio.preprocessor import AudioPreprocessor
from backend.app.models.schemas import VoiceAnalysisResult
from backend.app.services.ott_identity_engine import ott_identity_engine
from backend.app.services.ott_trust_engine import ott_trust_engine
from backend.app.services.screen_share_engine import screen_share_engine
from backend.app.services.video_engine import video_analysis_engine
from backend.app.services.url_analyzer import url_analyzer

ott_ws_router = APIRouter(tags=["OTT WebSocket Real-Time Protection"])

supervisor = SupervisorAgent()
deepfake_detector = VoiceDeepfakeDetector()

# OTP/Credential solicitation patterns for fast-path detection
CREDENTIAL_DEMAND_PATTERNS = [
    re.compile(p, re.IGNORECASE) for p in [
        r"\b(tell me the otp|share the otp|give me the otp|read the otp|type the otp)\b",
        r"\b(enter your pin|tell me your pin|share your password|give me your password)\b",
        r"\b(your card number|cvv|expiry date|bank account number|aadhaar number)\b",
        r"\b(send money|transfer now|pay immediately|upi id|qr code payment)\b",
    ]
]

REMOTE_TOOL_PATTERNS = [
    re.compile(p, re.IGNORECASE) for p in [
        r"\b(download anydesk|install anydesk|anydesk code|anydesk address)\b",
        r"\b(quicksupport|teamviewer|rustdesk|remote desktop|remote access)\b",
        r"\b(download apk|install apk|enable accessibility|device admin|grant permission)\b",
    ]
]


def _check_credential_demand(text: str) -> bool:
    return any(p.search(text) for p in CREDENTIAL_DEMAND_PATTERNS)


def _check_remote_tool(text: str) -> bool:
    return any(p.search(text) for p in REMOTE_TOOL_PATTERNS)


@ott_ws_router.websocket("/ws/ott-call")
async def ott_call_websocket(websocket: WebSocket):
    """
    OTT-specific WebSocket endpoint for WhatsApp/Telegram/VoIP call safety monitoring.

    Message types accepted:
      SESSION_START    — initial session config (contact status, call origin, etc.)
      AUDIO_CHUNK      — base64-encoded audio chunk
      TEXT_CHUNK       — transcript text chunk
      SCREEN_SHARE_ON  — screen sharing activated
      SCREEN_SHARE_OFF — screen sharing stopped
      VIDEO_FRAME_META — video frame metadata (risk signals only, no raw frames)
      CHAT_LINK        — link shared in surrounding chat
      CHAT_FILE        — file metadata shared in surrounding chat
      SESSION_END      — call ended
    """
    await websocket.accept()
    session_id = str(uuid.uuid4())

    # Session state
    accumulated_transcript = ""
    chunk_index = 0
    cached_voice_risk = 10.0
    screen_share_active = False
    screen_share_event_timestamps = []
    video_extortion_pattern_detected = False
    link_risks = []
    call_start_time = datetime.datetime.utcnow()

    # OTT identity context (populated from SESSION_START)
    ott_identity_context = {
        "is_saved_contact": False,
        "contact_name": None,
        "call_origin": "DIRECT_DIAL",
        "account_age_days": None,
        "phone_number": None,
        "caller_display_name": None,
        "is_video_call": False,
        "chat_messages_before_call": 0,
        "has_unsolicited_link_before_call": False,
        "user_typical_country_codes": None,
    }

    # Pre-computed identity risk
    identity_analysis = ott_identity_engine.analyze_caller(**ott_identity_context)
    ott_identity_risk = identity_analysis["identity_risk_score"]

    try:
        # Send handshake
        await websocket.send_json({
            "type": "OTT_SESSION_INIT",
            "sessionId": session_id,
            "status": "CONNECTED",
            "trustScore": 100,
            "riskScore": 0,
            "classification": "SAFE",
            "message": "Silent Witness OTT Protection Active — WhatsApp/Telegram/VoIP monitoring armed.",
            "capabilities": {
                "screen_share_detection": "ACTIVE",
                "video_extortion_detection": "ACTIVE",
                "ott_identity_analysis": "ACTIVE",
                "link_scanner": "ACTIVE",
                "voice_authenticity": "LIMITED (OTT audio quality)",
                "honesty_note": "Audio capture depends on OS accessibility permissions. Raw video frames are never stored."
            }
        })

        while True:
            raw_msg = await websocket.receive_text()
            try:
                data = json.loads(raw_msg)
            except Exception:
                continue

            msg_type = data.get("type", "TEXT_CHUNK")
            is_final = data.get("isFinal", False)
            chunk_index += 1
            fast_path_event = None

            # ──────────────────────────────────────────────────
            # 1. SESSION_START — initialize identity context
            # ──────────────────────────────────────────────────
            if msg_type == "SESSION_START":
                ctx = data.get("context", {})
                ott_identity_context.update({
                    "is_saved_contact": ctx.get("is_saved_contact", False),
                    "contact_name": ctx.get("contact_name"),
                    "call_origin": ctx.get("call_origin", "DIRECT_DIAL"),
                    "account_age_days": ctx.get("account_age_days"),
                    "phone_number": ctx.get("phone_number"),
                    "caller_display_name": ctx.get("caller_display_name"),
                    "is_video_call": ctx.get("is_video_call", False),
                    "chat_messages_before_call": ctx.get("chat_messages_before_call", 0),
                    "has_unsolicited_link_before_call": ctx.get("has_unsolicited_link_before_call", False),
                    "user_typical_country_codes": ctx.get("user_typical_country_codes"),
                })
                identity_analysis = ott_identity_engine.analyze_caller(**ott_identity_context)
                ott_identity_risk = identity_analysis["identity_risk_score"]

                await websocket.send_json({
                    "event": "identity_assessed",
                    "data": {
                        "identity_risk_score": ott_identity_risk,
                        "risk_tier": identity_analysis["risk_tier"],
                        "tier_label": identity_analysis["tier_label"],
                        "risk_factors": identity_analysis["risk_factors"],
                        "honesty_note": identity_analysis["honesty_note"],
                    }
                })
                continue

            # ──────────────────────────────────────────────────
            # 2. SCREEN_SHARE_ON — immediate fast-path check
            # ──────────────────────────────────────────────────
            elif msg_type == "SCREEN_SHARE_ON":
                screen_share_active = True
                ts = datetime.datetime.utcnow().isoformat()
                screen_share_event_timestamps.append({"event": "ON", "timestamp": ts})

                # Immediate fast-path check the moment screen sharing turns on
                financial_ctx = ott_trust_engine.detect_financial_context(accumulated_transcript)
                override = None
                if financial_ctx or len(accumulated_transcript) < 10:
                    # If financial context already exists OR this is very early in call —
                    # both are high-risk patterns (pre-seeded bank scenario OR cold screen-share demand)
                    from backend.app.services.ott_trust_engine import FAST_PATH_OVERRIDE_RULES
                    override = {
                        "fast_path_triggered": True,
                        "rule_name": "screen_share_financial_override",
                        "description": "Screen sharing activated — financial context present or early-call coercion",
                        "risk_floor": 92,
                        "trust_ceiling": 8,
                        "label": "🚨 CRITICAL: Screen-share + financial context — STOP SHARING NOW",
                        "recommended_action": "STOP_SCREEN_SHARE_AND_END_CALL",
                    }

                await websocket.send_json({
                    "event": "screen_share_activated",
                    "data": {
                        "screen_share_active": True,
                        "timestamp": ts,
                        "financial_context_detected": financial_ctx,
                        "fast_path_override": override,
                        "immediate_recommendation": (
                            "⚠️ SCREEN SHARING IS NOW ACTIVE. "
                            "If this call involves ANY financial or credential context, "
                            "STOP SHARING IMMEDIATELY. Legitimate banks never ask for screen access."
                        )
                    }
                })

                if override:
                    await websocket.send_json({
                        "type": "FAST_PATH_CRITICAL_ALERT",
                        "sessionId": session_id,
                        "alert": {
                            "title": "STOP SCREEN SHARING NOW",
                            "severity": "CRITICAL",
                            "riskScore": 92,
                            "trustScore": 8,
                            "rule": override["rule_name"],
                            "label": override["label"],
                            "action": override["recommended_action"],
                            "bullets": [
                                "Screen sharing gives the caller full view of your banking apps",
                                "OTPs arriving by SMS will be visible to the attacker immediately",
                                "Passwords you type are visible in real time",
                                "Legitimate banks and official agencies NEVER ask for screen access"
                            ],
                            "emergency_actions": [
                                {"id": "stop_sharing", "label": "STOP SHARING", "severity": "primary"},
                                {"id": "end_call", "label": "END CALL", "severity": "danger"},
                                {"id": "block_caller", "label": "BLOCK CALLER", "severity": "danger"},
                            ]
                        }
                    })
                continue

            # ──────────────────────────────────────────────────
            # 3. SCREEN_SHARE_OFF
            # ──────────────────────────────────────────────────
            elif msg_type == "SCREEN_SHARE_OFF":
                screen_share_active = False
                ts = datetime.datetime.utcnow().isoformat()
                screen_share_event_timestamps.append({"event": "OFF", "timestamp": ts})
                await websocket.send_json({
                    "event": "screen_share_deactivated",
                    "data": {"screen_share_active": False, "timestamp": ts}
                })
                continue

            # ──────────────────────────────────────────────────
            # 4. VIDEO_FRAME_META — process without storing
            # ──────────────────────────────────────────────────
            elif msg_type == "VIDEO_FRAME_META":
                frame_signals = data.get("signals", {})
                # Signals sent from client-side lightweight on-device detector:
                # inappropriate_content: bool, unusual_content_type: str, caller_unknown: bool
                inappropriate = frame_signals.get("inappropriate_content", False)
                call_duration_sec = frame_signals.get("call_duration_sec", 999)

                # Extortion pattern: inappropriate content on video call from unknown, within first 30s
                if (
                    inappropriate
                    and not ott_identity_context.get("is_saved_contact", False)
                    and call_duration_sec < 60
                ):
                    video_extortion_pattern_detected = True
                    await websocket.send_json({
                        "type": "FAST_PATH_CRITICAL_ALERT",
                        "sessionId": session_id,
                        "alert": {
                            "title": "VIDEO EXTORTION SETUP DETECTED — END CALL NOW",
                            "severity": "CRITICAL",
                            "riskScore": 90,
                            "trustScore": 10,
                            "rule": "video_extortion_override",
                            "label": "🚨 CRITICAL: Video blackmail setup detected",
                            "action": "END_CALL_AND_BLOCK",
                            "bullets": [
                                "Inappropriate content from an unknown caller within seconds is a classic extortion tactic",
                                "The caller may be recording your reaction to use as blackmail",
                                "DO NOT PANIC — do not make any payments",
                                "End the call, block the number, and report it immediately"
                            ],
                            "emergency_actions": [
                                {"id": "end_call", "label": "END CALL NOW", "severity": "danger"},
                                {"id": "block_caller", "label": "BLOCK & REPORT", "severity": "danger"},
                                {"id": "cover_camera", "label": "COVER CAMERA", "severity": "warning"},
                            ]
                        }
                    })
                continue

            # ──────────────────────────────────────────────────
            # 5. CHAT_LINK — scan for phishing/malware
            # ──────────────────────────────────────────────────
            elif msg_type == "CHAT_LINK":
                url = data.get("url", "")
                if url:
                    link_result = url_analyzer.analyze_url(url)
                    link_risk = link_result.get("risk_score", 0)
                    link_risks.append(link_risk)
                    await websocket.send_json({
                        "event": "link_scanned",
                        "data": {
                            "url": url[:80] + "..." if len(url) > 80 else url,
                            "risk_score": link_risk,
                            "risk_level": link_result.get("risk_level", "UNKNOWN"),
                            "indicators": link_result.get("indicators", []),
                            "recommendation": (
                                "DO NOT CLICK this link. Scammers often share phishing links "
                                "during or around OTT calls to reinforce fake scenarios."
                                if link_risk >= 60 else "Link appears low-risk, but stay cautious."
                            )
                        }
                    })
                continue

            # ──────────────────────────────────────────────────
            # 6. CHAT_FILE — warn about APK/suspicious files
            # ──────────────────────────────────────────────────
            elif msg_type == "CHAT_FILE":
                filename = data.get("filename", "")
                file_risk = 0
                file_indicators = []
                if filename.lower().endswith(".apk"):
                    file_risk = 90
                    file_indicators.append("APK file — potential malware or unauthorized app")
                elif filename.lower().endswith(".pdf"):
                    file_risk = 40
                    file_indicators.append("PDF file — may be a fake KYC form or phishing document")
                await websocket.send_json({
                    "event": "file_scanned",
                    "data": {
                        "filename": filename,
                        "risk_score": file_risk,
                        "indicators": file_indicators,
                        "recommendation": (
                            "DO NOT install or open this file." if file_risk >= 60
                            else "Exercise caution before opening files from unknown senders."
                        )
                    }
                })
                if file_risk >= 60:
                    link_risks.append(file_risk)
                continue

            # ──────────────────────────────────────────────────
            # 7. AUDIO_CHUNK — process audio, extract voice signals
            # ──────────────────────────────────────────────────
            if msg_type == "AUDIO_CHUNK" and "audioBase64" in data:
                try:
                    audio_bytes = base64.b64decode(data["audioBase64"])
                    audio_data, sr = AudioPreprocessor.load_audio_from_bytes(audio_bytes)
                    audio_16k = AudioPreprocessor.resample_if_needed(audio_data, sr, 16000)
                    duration = len(audio_16k) / 16000.0
                    voice_res = deepfake_detector.analyze_audio(audio_16k, duration)
                    cached_voice_risk = voice_res.voiceRisk
                except Exception:
                    pass

            # ──────────────────────────────────────────────────
            # 8. TEXT_CHUNK — accumulate transcript
            # ──────────────────────────────────────────────────
            new_text = data.get("text", "")
            if new_text.strip():
                accumulated_transcript = (
                    accumulated_transcript + " " + new_text.strip()
                    if accumulated_transcript else new_text.strip()
                )

            if not accumulated_transcript.strip():
                continue

            # ──────────────────────────────────────────────────
            # 9. Compute real-time signals
            # ──────────────────────────────────────────────────

            # Screen-share coercion via transcript
            ss_analysis = screen_share_engine.analyze_text(accumulated_transcript)
            screen_share_coercion = ss_analysis.get("is_screen_share_demanded", False)

            # Credential/OTP demand check
            otp_solicited = _check_credential_demand(accumulated_transcript)

            # Remote tool demand check
            remote_tool_requested = _check_remote_tool(accumulated_transcript)
            apk_download_requested = (
                "apk" in accumulated_transcript.lower()
                and any(w in accumulated_transcript.lower() for w in ["download", "install", "open"])
            )

            # Base NLP analysis via supervisor
            voice_result_obj = VoiceAnalysisResult(
                voiceRisk=cached_voice_risk,
                confidence=0.75,
                indicators=["OTT audio quality — reliability reduced"],
                is_synthetic_suspected=(cached_voice_risk >= 65.0)
            )
            nlp_analysis = supervisor.process_conversation(
                transcript=accumulated_transcript,
                voice_result=voice_result_obj,
                is_provisional=not is_final,
                session_id=session_id,
                channel="WHATSAPP"
            )
            base_nlp_risk = float(nlp_analysis.riskScore)

            # Max link risk
            max_link_risk = max(link_risks) if link_risks else 0.0

            # Video extortion from analysis
            vid_extortion_risk = 90.0 if video_extortion_pattern_detected else 0.0
            if nlp_analysis.videoAnalysisResult:
                vid_extortion_risk = max(vid_extortion_risk, nlp_analysis.videoAnalysisResult.get("visual_risk", 0))

            # ──────────────────────────────────────────────────
            # 10. OTT Trust Score Fusion
            # ──────────────────────────────────────────────────
            ott_fusion = ott_trust_engine.compute_ott_trust_score(
                transcript=accumulated_transcript,
                base_nlp_risk=base_nlp_risk,
                voice_risk=cached_voice_risk,
                screen_share_risk=float(ss_analysis.get("screen_share_risk", 0)),
                video_extortion_risk=vid_extortion_risk,
                ott_identity_risk=ott_identity_risk,
                link_file_risk=max_link_risk,
                screen_share_active=screen_share_active,
                screen_share_coercion_detected=screen_share_coercion,
                video_extortion_pattern=video_extortion_pattern_detected,
                otp_solicited=otp_solicited,
                remote_access_tool_requested=remote_tool_requested,
                apk_download_requested=apk_download_requested,
                call_origin=ott_identity_context.get("call_origin", "DIRECT_DIAL"),
            )

            final_risk = ott_fusion["ott_risk_score"]
            final_trust = ott_fusion["ott_trust_score"]

            # ──────────────────────────────────────────────────
            # 11. Emit events
            # ──────────────────────────────────────────────────

            # Transcript update
            await websocket.send_json({
                "event": "transcript_update",
                "data": {
                    "text": new_text,
                    "accumulated": accumulated_transcript,
                    "isFinal": is_final
                }
            })

            # Fast-path critical alert if triggered
            if ott_fusion["fast_path_triggered"] and ott_fusion.get("fast_path_override"):
                override = ott_fusion["fast_path_override"]
                await websocket.send_json({
                    "type": "FAST_PATH_CRITICAL_ALERT",
                    "sessionId": session_id,
                    "alert": {
                        "title": override.get("label", "CRITICAL RISK DETECTED"),
                        "severity": "CRITICAL",
                        "riskScore": final_risk,
                        "trustScore": final_trust,
                        "rule": override.get("rule_name"),
                        "action": override.get("recommended_action"),
                        "bullets": [
                            "Cease sharing any sensitive information immediately",
                            "Do not enter OTPs, PINs, or passwords while this call is active",
                            "Legitimate banks and tech support never require screen access",
                        ],
                        "emergency_actions": [
                            {"id": "stop_sharing", "label": "STOP SHARING", "severity": "primary"},
                            {"id": "end_call", "label": "END CALL", "severity": "danger"},
                            {"id": "block_caller", "label": "BLOCK CALLER", "severity": "danger"},
                        ]
                    }
                })

            # Evidence found
            if nlp_analysis.evidence:
                await websocket.send_json({
                    "event": "evidence_found",
                    "data": [e.model_dump() for e in nlp_analysis.evidence]
                })

            # OTT risk update (primary update event)
            await websocket.send_json({
                "event": "ott_risk_update",
                "data": {
                    "riskScore": final_risk,
                    "trustScore": final_trust,
                    "classification": ott_fusion["classification"],
                    "severityLabel": ott_fusion["severity_label"],
                    "fastPathTriggered": ott_fusion["fast_path_triggered"],
                    "screenShareActive": screen_share_active,
                    "screenShareCoercionDetected": screen_share_coercion,
                    "ottSignals": ott_fusion["ott_signals_detected"],
                    "attribution": ott_fusion["attribution"],
                    "identityRisk": ott_identity_risk,
                    "linkRisk": max_link_risk,
                    "isProvisional": not is_final,
                }
            })

            # Consolidated LIVE_UPDATE
            await websocket.send_json({
                "type": "OTT_LIVE_UPDATE",
                "sessionId": session_id,
                "chunkIndex": chunk_index,
                "isProvisional": not is_final,
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "analysis": {
                    **nlp_analysis.model_dump(),
                    "riskScore": final_risk,
                    "trustScore": final_trust,
                    "classification": ott_fusion["classification"],
                    "ott_fusion": ott_fusion,
                    "identity_analysis": identity_analysis,
                    "screen_share_active": screen_share_active,
                    "screen_share_analysis": ss_analysis,
                    "channel": "WHATSAPP",
                }
            })

            if is_final:
                await websocket.send_json({
                    "type": "OTT_CALL_CONCLUDED",
                    "sessionId": session_id,
                    "finalRiskScore": final_risk,
                    "finalTrustScore": final_trust,
                    "screenShareEvents": screen_share_event_timestamps,
                    "totalDurationSec": (datetime.datetime.utcnow() - call_start_time).seconds,
                    "finalClassification": ott_fusion["classification"],
                    "summary": {
                        "ott_signals": ott_fusion["ott_signals_detected"],
                        "identity_risk": ott_identity_risk,
                        "link_risks": link_risks,
                        "fast_path_triggered": ott_fusion["fast_path_triggered"],
                    }
                })
                break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({
                "type": "ERROR",
                "message": f"OTT protection error: {str(e)}"
            })
        except Exception:
            pass
