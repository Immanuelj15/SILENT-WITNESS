import json
import base64
import uuid
import datetime
import re
import asyncio
from typing import Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState
from backend.app.agents.supervisor_agent import SupervisorAgent
from backend.app.audio.deepfake_detector import VoiceDeepfakeDetector
from backend.app.audio.preprocessor import AudioPreprocessor
from backend.app.models.schemas import VoiceAnalysisResult
from backend.app.core.llm_gateway import llm_gateway
from backend.app.evidence.verifier import merkle_audit_ledger

ws_router = APIRouter(tags=["WebSocket Real-Time Stream"])
supervisor = SupervisorAgent()
deepfake_detector = VoiceDeepfakeDetector()


def mask_pii(text: str) -> str:
    """
    Regex-based PII Masking: Redacts credit card numbers, bank account numbers,
    and sensitive OTP codes before agent processing and ledger storage.
    """
    if not text:
        return text

    # 1. Credit Card Numbers (13 to 16 digits, with optional spaces or dashes)
    masked = re.sub(r'\b(?:\d[ -]*?){13,16}\b', '[CARD_REDACTED]', text)

    # 2. Bank Account Numbers (9 to 18 consecutive digits near account keywords)
    masked = re.sub(r'(?i)\b(?:account|acct|a/c)[\s#:]*(\d{9,18})\b', r'account [ACCOUNT_REDACTED]', masked)

    # 3. CVVs and Security Codes (3 to 4 digits near cvv/cvc keyword)
    masked = re.sub(r'(?i)\b(cvv|cvc|security code|cid)\s*(?:is|:)?\s*(\d{3,4})\b', r'\1 [CVV_REDACTED]', masked)

    # 4. OTPs and PINs (4 to 6 digits preceded by keyword or specific OTP patterns)
    masked = re.sub(r'(?i)\b(otp|one time password|pin|upi pin|password|verification)\s*(?:is|:)?\s*(\d{4,6})\b', r'\1 [OTP_REDACTED]', masked)
    masked = re.sub(r'(?i)(otp[:\s]+)\d{4,6}\b', r'\1[OTP_REDACTED]', masked)

    # 5. Standalone 6-digit numeric codes if transcript mentions banking keywords
    if any(k in masked.lower() for k in ["sbi", "hdfc", "icici", "axis", "bank", "verify", "code", "transaction"]):
        masked = re.sub(r'\b\d{6}\b', '[OTP_REDACTED]', masked)

    # 6. Card Expiry Dates (MM/YY or MM/YYYY)
    masked = re.sub(r'\b(0[1-9]|1[0-2])\/([2-3][0-9])\b', '[EXPIRY_REDACTED]', masked)

    # 7. Indian Aadhaar Numbers (12 digits with optional spaces: XXXX XXXX XXXX)
    masked = re.sub(r'\b\d{4}\s?\d{4}\s?\d{4}\b', '[AADHAAR_REDACTED]', masked)

    # 8. Indian PAN Card Numbers (5 letters, 4 digits, 1 letter: ABCDE1234F)
    masked = re.sub(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b', '[PAN_REDACTED]', masked)

    # 9. Government Social Security Numbers (3-2-4 digits)
    masked = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[SSN_REDACTED]', masked)

    return masked


async def run_live_call_loop(websocket: WebSocket, session_id: str):
    await websocket.accept()
    accumulated_transcript = ""
    chunk_index = 0
    cached_voice_risk = 15.0

    # Initial session handshake
    genesis_hash = merkle_audit_ledger.get_latest_hash(session_id)
    await websocket.send_json({
        "type": "SESSION_INIT",
        "sessionId": session_id,
        "status": "CONNECTED",
        "threat_level": "SAFE",
        "composite_risk": 0.05,
        "identified_scam_type": "None",
        "live_coaching_directives": ["Silent Witness Guardian armed. Monitoring active communication..."],
        "audit_hash": genesis_hash,
        "trustScore": 100,
        "riskScore": 0,
        "classification": "SAFE",
        "message": "Silent Witness live safety layer activated."
    })

    try:
        while True:
            raw_msg = await websocket.receive_text()
            try:
                data = json.loads(raw_msg)
            except Exception:
                continue

            msg_type = data.get("type", "TEXT_CHUNK")
            is_final = data.get("isFinal", False)
            caller_metadata = data.get("callerMetadata", {})
            chunk_index += 1

            voice_res: Optional[VoiceAnalysisResult] = None

            # 1. Handle incoming audio chunk (base64 PCM / WAV)
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

            # 2. Extract and PII-mask incoming speech snippet
            new_text = data.get("text", "")
            masked_new_text = mask_pii(new_text)

            if masked_new_text.strip():
                if accumulated_transcript:
                    accumulated_transcript += " " + masked_new_text.strip()
                else:
                    accumulated_transcript = masked_new_text.strip()

            # 3. Query Token-Saving LLM Gateway (MockLLMService or OpenRouter)
            llm_verdict = await llm_gateway.evaluate_dialogue_async(
                transcript=accumulated_transcript,
                caller_metadata=caller_metadata
            )

            threat_level = llm_verdict.get("threat_level", "SAFE")
            composite_risk = float(llm_verdict.get("composite_risk", 0.05))
            identified_scam_type = llm_verdict.get("identified_scam_type", "Routine Conversation")
            live_coaching = llm_verdict.get("live_coaching_directives", [])

            # 4. Record Merkle-linked cryptographic audit block
            audit_block = merkle_audit_ledger.record_event(
                session_id=session_id,
                transcript=accumulated_transcript,
                verdict=llm_verdict
            )

            # 5. Process through Multi-Agent Supervisor
            if not voice_res:
                voice_res = VoiceAnalysisResult(
                    voiceRisk=cached_voice_risk,
                    confidence=0.75,
                    indicators=["Acoustic continuity normal"],
                    is_synthetic_suspected=(cached_voice_risk >= 65.0)
                )

            analysis = supervisor.process_conversation(
                transcript=accumulated_transcript,
                voice_result=voice_res,
                is_provisional=not is_final,
                session_id=session_id
            )
            analysis.id = session_id
            analysis.is_provisional = not is_final

            # Synchronize composite risk & classifications
            effective_risk_score = max(analysis.riskScore, int(composite_risk * 100))
            effective_trust_score = max(0, 100 - effective_risk_score)
            effective_classification = threat_level if threat_level in ["CRITICAL", "HIGH"] else analysis.classification

            # Compute deepfake metric and screen-sharing indicators
            deepfake_metric = round(voice_res.confidence if (voice_res and voice_res.is_synthetic_suspected) else (voice_res.voiceRisk / 100.0 if voice_res else 0.0), 2)
            has_screen_share = bool(
                data.get("screen_share_active", False) or
                data.get("screen_share_detected", False) or
                (effective_risk_score >= 80 and "screen" in accumulated_transcript.lower() and ("share" in accumulated_transcript.lower() or "anydesk" in accumulated_transcript.lower() or "teamviewer" in accumulated_transcript.lower()))
            )

            # 6. Structured Payload meeting exact Native Android & Web contracts
            response_payload = {
                "type": "STREAM_UPDATE",
                "session_id": session_id,
                "threat_level": threat_level,
                "composite_risk": composite_risk,
                "identified_scam_type": identified_scam_type,
                "live_coaching_directives": live_coaching,
                "deepfake_confidence": deepfake_metric,
                "screen_share_risk": has_screen_share,
                "audit_hash": audit_block.audit_hash,
                "block_index": audit_block.block_index,
                "timestamp": audit_block.timestamp,
                "masked_transcript": accumulated_transcript,
                # Legacy / Web dashboard compatibility fields
                "trustScore": effective_trust_score,
                "riskScore": effective_risk_score,
                "classification": effective_classification,
                "confidence": analysis.confidence,
                "evidence": [e.model_dump() for e in analysis.evidence],
                "intentChain": analysis.intentChain,
                "isProvisional": not is_final,
                "explanation": llm_verdict.get("explanation", analysis.aiExplanation)
            }

            # Send primary structured evaluation
            await websocket.send_json(response_payload)

            # Event: transcript update
            await websocket.send_json({
                "event": "transcript_final" if is_final else "transcript_partial",
                "data": {
                    "text": masked_new_text,
                    "accumulatedTranscript": accumulated_transcript,
                    "isFinal": is_final
                }
            })

            # Event: LIVE_UPDATE for web app compatibility
            await websocket.send_json({
                "type": "LIVE_UPDATE",
                "sessionId": session_id,
                "chunkIndex": chunk_index,
                "isProvisional": not is_final,
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "payload": response_payload,
                "analysis": analysis.model_dump()
            })

            if is_final:
                from backend.app.services.report_generator import report_generator
                report_data = report_generator.generate_report(
                    call_id=session_id,
                    analysis_result=analysis.model_dump(),
                    intent_chain=analysis.intentChain,
                    timeline_events=analysis.timeline,
                    identity_audit=analysis.identityAudit,
                    multilingual_info=analysis.multilingual,
                    duration_seconds=float(chunk_index * 3.0)
                )
                await websocket.send_json({
                    "event": "report_ready",
                    "data": report_data,
                    "audit_chain_verified": merkle_audit_ledger.verify_chain(session_id),
                    "latest_audit_hash": audit_block.audit_hash
                })
                await websocket.send_json({
                    "type": "CALL_CONCLUDED",
                    "sessionId": session_id,
                    "finalAnalysis": analysis.model_dump(),
                    "report": report_data
                })
                break

    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    except Exception as e:
        try:
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.send_json({
                    "type": "ERROR",
                    "message": f"Real-time processing error: {str(e)}"
                })
        except Exception:
            pass


@ws_router.websocket("/ws/live-call/{session_id}")
async def live_call_session_websocket(websocket: WebSocket, session_id: str):
    """
    Dedicated Session WebSocket for Native Android & Companion Clients.
    """
    await run_live_call_loop(websocket, session_id)


@ws_router.websocket("/ws/live-call")
async def live_call_default_websocket(websocket: WebSocket):
    """
    Auto-assigned Session WebSocket for Web Clients.
    """
    session_id = str(uuid.uuid4())
    await run_live_call_loop(websocket, session_id)
