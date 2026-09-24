import json
import base64
import uuid
import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.app.agents.supervisor_agent import SupervisorAgent
from backend.app.audio.deepfake_detector import VoiceDeepfakeDetector
from backend.app.audio.preprocessor import AudioPreprocessor
from backend.app.models.schemas import VoiceAnalysisResult

ws_router = APIRouter(tags=["WebSocket Real-Time Stream"])
supervisor = SupervisorAgent()
deepfake_detector = VoiceDeepfakeDetector()

@ws_router.websocket("/ws/live-call")
async def live_call_websocket(websocket: WebSocket):
    await websocket.accept()
    session_id = str(uuid.uuid4())
    accumulated_transcript = ""
    chunk_index = 0
    cached_voice_risk = 15.0

    try:
        # Send initial connection handshake
        await websocket.send_json({
            "type": "SESSION_INIT",
            "sessionId": session_id,
            "status": "CONNECTED",
            "trustScore": 100,
            "riskScore": 0,
            "classification": "SAFE",
            "message": "Silent Witness live safety layer activated. Monitoring conversation..."
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

            voice_res: VoiceAnalysisResult = None

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

            # 2. Handle incoming text snippet / speech chunk
            new_text = data.get("text", "")
            if new_text.strip():
                if accumulated_transcript:
                    accumulated_transcript += " " + new_text.strip()
                else:
                    accumulated_transcript = new_text.strip()

            # 3. Analyze current accumulated context
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
                is_provisional=not is_final
            )
            analysis.id = session_id
            analysis.is_provisional = not is_final

            # 4. Stream back real-time delta update to frontend
            await websocket.send_json({
                "type": "LIVE_UPDATE",
                "sessionId": session_id,
                "chunkIndex": chunk_index,
                "isProvisional": not is_final,
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "analysis": analysis.model_dump()
            })

            if is_final:
                await websocket.send_json({
                    "type": "CALL_CONCLUDED",
                    "sessionId": session_id,
                    "finalAnalysis": analysis.model_dump()
                })
                break

    except WebSocketDisconnect:
        # Graceful disconnect
        pass
    except Exception as e:
        try:
            await websocket.send_json({
                "type": "ERROR",
                "message": f"Real-time processing error: {str(e)}"
            })
        except Exception:
            pass
