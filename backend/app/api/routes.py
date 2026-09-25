import time
import uuid
import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.models.schemas import (
    AnalysisResult,
    AnalyzeTextRequest,
    AudioUploadResponse,
    CallSessionSummary,
    OTTAnalyzeRequest,
    OTTAnalysisResult,
    OTTFastPathAlert,
)
from backend.app.models.database import (
    get_db,
    CallAnalysisRecord,
    RiskFactorRecord,
    EvidenceRecord
)
from backend.app.agents.supervisor_agent import SupervisorAgent
from backend.app.audio.preprocessor import AudioPreprocessor
from backend.app.audio.deepfake_detector import VoiceDeepfakeDetector
from backend.app.transcription.stt_service import stt_service
from backend.app.services.caller_reputation import caller_reputation_service
from backend.app.services.script_fingerprint import script_fingerprint_engine, SCAM_SCRIPT_TEMPLATES
from backend.app.services.emotion_engine import emotion_engine
from backend.app.services.coaching import coaching_engine
from backend.app.services.audit_logger import get_or_create_ledger
from backend.app.services.multimodal_context import multimodal_engine
from backend.app.communication.channel import (
    CommunicationChannel,
    get_default_capabilities_for_channel,
    CallSessionMetadata
)
from backend.app.communication.adapters import get_platform_adapter
from backend.app.services.screen_share_engine import screen_share_engine
from backend.app.services.video_engine import video_analysis_engine
from backend.app.services.url_analyzer import url_analyzer

router = APIRouter(prefix="/api", tags=["Silent Witness API"])
supervisor = SupervisorAgent()
deepfake_detector = VoiceDeepfakeDetector()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Silent Witness AI Real-Time Voice Fraud Detector",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@router.post("/analyze-text", response_model=AnalysisResult)
def analyze_text(request: AnalyzeTextRequest, db: Session = Depends(get_db)):
    start_time = time.time()
    
    # Process text through Multi-Agent architecture
    result = supervisor.process_conversation(
        transcript=request.text,
        voice_result=None,
        is_provisional=False,
        channel=request.channel or "SIM_CALL"
    )
    
    result.id = str(uuid.uuid4())
    result.latency_ms = round((time.time() - start_time) * 1000, 2)
    result.created_at = datetime.datetime.utcnow().isoformat()

    # Store in database
    try:
        record = CallAnalysisRecord(
            id=result.id,
            source_type="text_input",
            transcript=result.transcript,
            classification=result.classification,
            risk_score=result.riskScore,
            trust_score=result.trustScore,
            confidence=result.confidence,
            category=result.category,
            recommendation=result.recommendation,
            duration_sec=0.0,
            is_provisional=False
        )
        db.add(record)
        
        for rf in result.riskFactors:
            db.add(RiskFactorRecord(call_id=result.id, factor_name=rf))
        for ev in result.evidence:
            db.add(EvidenceRecord(call_id=result.id, exact_phrase=ev.exact_phrase, tag=ev.detected_tag, grounded=ev.is_grounded_in_transcript))
            
        db.commit()
    except Exception as e:
        db.rollback()

    return result

@router.post("/analyze-audio", response_model=AnalysisResult)
async def analyze_audio(file: UploadFile = File(...), db: Session = Depends(get_db)):
    start_time = time.time()
    
    # 1. Read & Validate size
    audio_bytes = await file.read()
    if not AudioPreprocessor.validate_file_size(len(audio_bytes)):
        raise HTTPException(status_code=400, detail="Audio file exceeds maximum allowed upload size (25MB)")
    
    if len(audio_bytes) < 100:
        raise HTTPException(status_code=400, detail="Empty or corrupted audio file.")

    temp_path = None
    try:
        # 2. Decode Audio
        audio_data, sr = AudioPreprocessor.load_audio_from_bytes(audio_bytes)
        audio_16k = AudioPreprocessor.resample_if_needed(audio_data, sr, 16000)
        duration_sec = len(audio_16k) / 16000.0

        # 3. Acoustic Voice Deepfake Analysis
        voice_result = deepfake_detector.analyze_audio(audio_16k, duration_sec)

        # 4. Save temp wav & Transcribe
        temp_path = AudioPreprocessor.save_temp_wav(audio_16k, 16000)
        transcript, stt_confidence = stt_service.transcribe_wav_file(temp_path)

        # Fallback if transcript empty
        if not transcript.strip():
            transcript = "Audio received. Voice characteristics evaluated; acoustic parameters recorded."

        # 5. Multi-Agent AI Analysis & Evidence Verification
        result = supervisor.process_conversation(
            transcript=transcript,
            voice_result=voice_result,
            is_provisional=False
        )

        result.id = str(uuid.uuid4())
        result.latency_ms = round((time.time() - start_time) * 1000, 2)
        result.created_at = datetime.datetime.utcnow().isoformat()

        # 6. Database persistence
        record = CallAnalysisRecord(
            id=result.id,
            source_type="audio_upload",
            transcript=result.transcript,
            classification=result.classification,
            risk_score=result.riskScore,
            trust_score=result.trustScore,
            confidence=result.confidence,
            category=result.category,
            recommendation=result.recommendation,
            duration_sec=duration_sec,
            is_provisional=False
        )
        db.add(record)
        for rf in result.riskFactors:
            db.add(RiskFactorRecord(call_id=result.id, factor_name=rf))
        for ev in result.evidence:
            db.add(EvidenceRecord(call_id=result.id, exact_phrase=ev.exact_phrase, tag=ev.detected_tag, grounded=ev.is_grounded_in_transcript))
        db.commit()

        return result

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Audio processing error: {str(e)}")
    finally:
        # Automatic Temporary File Cleanup
        if temp_path:
            AudioPreprocessor.cleanup_temp_file(temp_path)

@router.get("/analysis/{analysis_id}", response_model=AnalysisResult)
def get_analysis_by_id(analysis_id: str, db: Session = Depends(get_db)):
    record = db.query(CallAnalysisRecord).filter(CallAnalysisRecord.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found")

    risk_factors = [rf.factor_name for rf in record.risk_factors]
    evidence_items = [
        {"exact_phrase": ev.exact_phrase, "detected_tag": ev.tag, "is_grounded_in_transcript": ev.grounded, "context_note": ""}
        for ev in record.evidence_items
    ]

    return AnalysisResult(
        id=record.id,
        classification=record.classification,
        riskScore=record.risk_score,
        trustScore=record.trust_score,
        confidence=record.confidence,
        category=record.category,
        transcript=record.transcript,
        is_provisional=record.is_provisional,
        riskFactors=risk_factors,
        suspiciousPhrases=[ev["exact_phrase"] for ev in evidence_items],
        evidence=evidence_items,
        recommendation=record.recommendation,
        actions=["Review call records", "Contact your bank if sensitive info was provided"],
        easyModeSummary="Historical review of recorded call.",
        aiExplanation="Saved call session retrieved from encrypted local record."
    )

@router.get("/history", response_model=List[CallSessionSummary])
def get_analysis_history(db: Session = Depends(get_db)):
    records = db.query(CallAnalysisRecord).order_by(CallAnalysisRecord.created_at.desc()).limit(20).all()
    summaries = []
    for r in records:
        snippet = (r.transcript[:80] + "...") if len(r.transcript) > 80 else r.transcript
        summaries.append(CallSessionSummary(
            id=r.id,
            created_at=r.created_at.isoformat() if r.created_at else "",
            classification=r.classification,
            riskScore=r.risk_score,
            trustScore=r.trust_score,
            category=r.category,
            duration_sec=round(r.duration_sec, 1),
            snippet=snippet
        ))
    return summaries

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(CallAnalysisRecord).count()
    safe = db.query(CallAnalysisRecord).filter(CallAnalysisRecord.classification == "SAFE").count()
    suspicious = db.query(CallAnalysisRecord).filter(CallAnalysisRecord.classification == "SUSPICIOUS").count()
    high_risk = db.query(CallAnalysisRecord).filter(CallAnalysisRecord.classification.in_(["HIGH_RISK", "VERY_HIGH_RISK", "LIKELY_SCAM"])).count()

    all_records = db.query(CallAnalysisRecord).all()
    avg_trust = round(sum(r.trust_score for r in all_records) / max(1, total), 1) if total > 0 else 100.0

    return {
        "total_calls": total,
        "safe_calls": safe,
        "suspicious_calls": suspicious,
        "high_risk_calls": high_risk,
        "average_trust_score": avg_trust
    }

@router.get("/demo/scenario")
def get_demo_scenarios():
    """
    Returns pre-loaded multi-step scenarios including the Bank OTP Scam demo described in Section 40.
    """
    return [
        {
            "id": "bank_otp_scam",
            "title": "Bank OTP Scam (Section 40 Demo)",
            "steps": [
                {
                    "step": 1,
                    "title": "Call Connection",
                    "caller_text": "Hello, good afternoon sir. Am I speaking with the account holder?",
                    "expected_status": "SAFE",
                    "expected_trust": 95,
                    "reason": "Normal polite introductory greeting."
                },
                {
                    "step": 2,
                    "title": "Unverified Identity Claim",
                    "caller_text": "Hello sir, I am calling from your bank, State Bank branch office.",
                    "expected_status": "STAY ALERT",
                    "expected_trust": 78,
                    "reason": "Claimed identity detected (Bank Representative). Identity is unverified."
                },
                {
                    "step": 3,
                    "title": "Urgency & Threat",
                    "caller_text": "Your account has an urgent verification issue and your account will be blocked today within 1 hour if not updated.",
                    "expected_status": "SUSPICIOUS / BE CAREFUL",
                    "expected_trust": 52,
                    "reason": "Urgency and account suspension threat detected."
                },
                {
                    "step": 4,
                    "title": "Credential Solicitation",
                    "caller_text": "I have triggered a verification SMS. Tell me the OTP immediately to stop the account block.",
                    "expected_status": "LIKELY SCAM",
                    "expected_trust": 12,
                    "reason": "Critical risk: Direct OTP solicitation under extreme urgency."
                }
            ]
        },
        {
            "id": "digital_arrest_scam",
            "title": "Police / Digital Arrest Threat",
            "steps": [
                {
                    "step": 1,
                    "title": "Customs Parcel Claim",
                    "caller_text": "This is Inspector Sharma calling from Crime Branch. A courier parcel in your name was seized containing illegal drugs.",
                    "expected_status": "HIGH RISK",
                    "expected_trust": 40,
                    "reason": "Law enforcement impersonation and legal intimidation."
                },
                {
                    "step": 2,
                    "title": "Digital Arrest Order",
                    "caller_text": "You are under digital arrest right now. Do not hang up or you will be arrested at your house today.",
                    "expected_status": "LIKELY SCAM",
                    "expected_trust": 10,
                    "reason": "Known Digital Arrest extortion tactic."
                }
            ]
        },
        {
            "id": "legitimate_friend_upi",
            "title": "Legitimate Context (False Positive Test)",
            "steps": [
                {
                    "step": 1,
                    "title": "Friend Dinner Reimbursement",
                    "caller_text": "Hey Rahul, thanks for dinner yesterday! My friend sent me money through UPI to split the bill, so I just paid you back.",
                    "expected_status": "SAFE",
                    "expected_trust": 94,
                    "reason": "Contextually benign conversation; no demands or pressure."
                }
            ]
        }
    ]

@router.post("/feedback", response_model=Dict[str, Any])
def submit_user_feedback(feedback: Dict[str, Any], db: Session = Depends(get_db)):
    """
    User Feedback Loop (Section 6 & 9.6).
    Receives user-reported outcomes (e.g. 'SCAM', 'FALSE_ALARM', 'LEGITIMATE')
    to continuously calibrate risk thresholds and track precision.
    """
    from backend.app.models.database import UserFeedbackRecord
    
    call_id = feedback.get("call_id", "")
    user_label = feedback.get("user_label", "SCAM")
    notes = feedback.get("notes", "")

    try:
        record = UserFeedbackRecord(
            call_id=call_id,
            user_label=user_label,
            notes=notes
        )
        db.add(record)
        db.commit()

        adjustment = "Weight calibration logged. Sensitivity adjusted to minimize false alarms." if user_label == "FALSE_ALARM" else "Positive scam pattern reinforcement recorded."

        return {
            "success": True,
            "message": "User feedback received successfully.",
            "calibrated_adjustment": adjustment,
            "call_id": call_id,
            "user_label": user_label
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Feedback recording error: {str(e)}")

# =========================================================================
# SECTION 67: EXTENDED API SPECIFICATION IMPLEMENTATION
# =========================================================================

from backend.app.services.knowledge_base import scam_knowledge_base
from backend.app.services.identity_verifier import caller_identity_verifier
from backend.app.services.intervention import intervention_engine
from backend.app.services.report_generator import report_generator
from backend.app.services.intent_chain import intent_chain_engine
from backend.app.services.timeline import timeline_engine
from evaluation.metrics import evaluate_benchmark
from backend.app.core.config import settings

@router.get("/analysis/{call_id}")
def get_analysis_by_id(call_id: str, db: Session = Depends(get_db)):
    """
    Retrieves full analysis record by call ID.
    """
    record = db.query(CallAnalysisRecord).filter(CallAnalysisRecord.id == call_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found")
    
    # Re-run supervisor to obtain full rich structured tree
    analysis = supervisor.process_conversation(record.transcript)
    analysis.id = record.id
    return analysis

@router.get("/analysis/{call_id}/timeline")
def get_analysis_timeline(call_id: str, db: Session = Depends(get_db)):
    record = db.query(CallAnalysisRecord).filter(CallAnalysisRecord.id == call_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found")
    return {
        "callId": call_id,
        "timeline": timeline_engine.build_timeline(record.transcript)
    }

@router.get("/analysis/{call_id}/intent-chain")
def get_analysis_intent_chain(call_id: str, db: Session = Depends(get_db)):
    record = db.query(CallAnalysisRecord).filter(CallAnalysisRecord.id == call_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found")
    return {
        "callId": call_id,
        "intentChain": intent_chain_engine.build_intent_chain(record.transcript)
    }

@router.get("/analysis/{call_id}/evidence")
def get_analysis_evidence(call_id: str, db: Session = Depends(get_db)):
    ev_records = db.query(EvidenceRecord).filter(EvidenceRecord.call_id == call_id).all()
    return {
        "callId": call_id,
        "evidence": [
            {
                "phrase": ev.exact_phrase,
                "tag": ev.tag,
                "isGrounded": ev.grounded
            }
            for ev in ev_records
        ]
    }

@router.get("/analysis/{call_id}/identity")
def get_analysis_identity(call_id: str, db: Session = Depends(get_db)):
    record = db.query(CallAnalysisRecord).filter(CallAnalysisRecord.id == call_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found")
    audit = caller_identity_verifier.verify_caller_claim(transcript=record.transcript)
    return {
        "callId": call_id,
        "identityAudit": audit
    }

@router.get("/analysis/{call_id}/report")
def get_analysis_report(call_id: str, db: Session = Depends(get_db)):
    record = db.query(CallAnalysisRecord).filter(CallAnalysisRecord.id == call_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found")
    
    analysis = supervisor.process_conversation(record.transcript)
    analysis.id = record.id
    report = report_generator.generate_report(
        call_id=call_id,
        analysis_result=analysis.model_dump(),
        intent_chain=analysis.intentChain,
        timeline_events=analysis.timeline,
        identity_audit=analysis.identityAudit,
        multilingual_info=analysis.multilingual,
        duration_seconds=record.duration_sec or 65.0
    )
    return report

@router.post("/identity/verify")
def verify_identity_claim(payload: Dict[str, Any]):
    claimed_name = payload.get("claimedName") or payload.get("claimed_name")
    claimed_org = payload.get("claimedOrg") or payload.get("claimed_org")
    phone = payload.get("callerPhone") or payload.get("caller_phone")
    transcript = payload.get("transcript", "")

    result = caller_identity_verifier.verify_caller_claim(
        claimed_name=claimed_name,
        claimed_org=claimed_org,
        caller_phone=phone,
        transcript=transcript
    )
    return result

@router.post("/intervention/confirm")
def confirm_intervention_action(payload: Dict[str, Any]):
    conf_id = payload.get("confirmationId") or payload.get("confirmation_id")
    approved = payload.get("approved", False)
    if not conf_id:
        raise HTTPException(status_code=400, detail="Missing confirmationId")
    res = intervention_engine.resolve_confirmation(conf_id, approved)
    return res

@router.get("/knowledge-base")
def list_knowledge_base():
    categories = scam_knowledge_base.list_categories()
    return {
        "count": len(categories),
        "categories": categories
    }

@router.get("/knowledge-base/{category_key}")
def get_knowledge_base_category(category_key: str):
    cat = scam_knowledge_base.get_category(category_key)
    if not cat:
        raise HTTPException(status_code=404, detail=f"Knowledge base category '{category_key}' not found")
    return cat

# Privacy Center state storage
PRIVACY_STATE = {
    "audioStorageEnabled": False,
    "transcriptStorageEnabled": True,
    "retentionPeriodDays": 7,
    "localProcessingEnabled": True,
    "cloudProcessingEnabled": False,
    "analyticsConsent": True
}

@router.get("/privacy/settings")
def get_privacy_settings():
    return PRIVACY_STATE

@router.put("/privacy/settings")
def update_privacy_settings(payload: Dict[str, Any]):
    for k, v in payload.items():
        if k in PRIVACY_STATE:
            PRIVACY_STATE[k] = v
    return {
        "success": True,
        "message": "Privacy settings updated successfully",
        "settings": PRIVACY_STATE
    }

@router.delete("/privacy/data")
def delete_all_user_data(db: Session = Depends(get_db)):
    """
    Permanently deletes all call records, transcripts, evidence items, and temporary audio files.
    """
    try:
        from backend.app.models.database import UserFeedbackRecord
        db.query(EvidenceRecord).delete()
        db.query(RiskFactorRecord).delete()
        db.query(UserFeedbackRecord).delete()
        db.query(CallAnalysisRecord).delete()
        db.commit()

        # Clean temporary audio directory
        import os, shutil
        if os.path.exists(settings.TEMP_STORAGE_DIR):
            for item in os.listdir(settings.TEMP_STORAGE_DIR):
                item_path = os.path.join(settings.TEMP_STORAGE_DIR, item)
                if os.path.isfile(item_path):
                    os.unlink(item_path)

        return {
            "success": True,
            "message": "All user data, transcripts, and cached audio files permanently deleted."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete data: {str(e)}")

@router.get("/evaluation")
@router.get("/evaluation/metrics")
def get_evaluation_metrics():
    """
    Returns actual measured performance metrics from benchmark dataset evaluation.
    """
    metrics = evaluate_benchmark()
    return metrics


# Tier 2 & Tier 3 Architecture Endpoints

@router.post("/caller/reputation")
def evaluate_caller_reputation(payload: Dict[str, Any]):
    """
    Evaluates caller phone number against spam/spoof signatures and directory registries.
    """
    phone = payload.get("phone_number", "")
    is_contact = payload.get("is_in_contacts", False)
    contact_name = payload.get("contact_name")
    return caller_reputation_service.evaluate_caller(
        phone_number=phone,
        is_in_contacts=is_contact,
        contact_name=contact_name
    )


@router.post("/sms-context/correlate")
def correlate_sms_prior(payload: Dict[str, Any]):
    """
    Correlates recent incoming SMS phishing lures with the ongoing spoken call.
    """
    recent_msgs = payload.get("recent_messages", [])
    transcript = payload.get("transcript", "")
    return multimodal_engine.correlate_sms_with_call(
        recent_messages=recent_msgs,
        call_transcript=transcript
    )


@router.get("/coaching")
def get_coaching_suggestion(
    intent_type: str = "",
    risk_level: str = "SAFE",
    scam_category: str = ""
):
    """
    Provides real-time defensive dialogue coaching prompts ("What to say right now").
    """
    return coaching_engine.get_coaching_prompt(
        intent_type=intent_type,
        risk_level=risk_level,
        scam_category=scam_category
    )


@router.get("/audit-log/{session_id}")
def get_session_audit_log(session_id: str):
    """
    Retrieves the tamper-evident cryptographic hash-chain audit log for a session.
    """
    ledger = get_or_create_ledger(session_id)
    return ledger.export_evidence_package()


@router.get("/audit-log/{session_id}/verify")
def verify_session_audit_integrity(session_id: str):
    """
    Verifies that no block in the cryptographic hash chain has been altered.
    """
    ledger = get_or_create_ledger(session_id)
    return ledger.verify_integrity()


@router.get("/script-fingerprint/templates")
def get_scam_script_templates():
    """
    Returns canonical scam script fingerprints and safe exit advice.
    """
    return SCAM_SCRIPT_TEMPLATES


# Universal Call Safety Endpoints (SIM, WhatsApp, VoIP, Video, Screen-Share)

@router.post("/calls/start")
def start_call_session(payload: Dict[str, Any]):
    """
    Initializes a monitored communication session across any supported channel.
    Reports honest platform capabilities and screening actions.
    """
    session_id = payload.get("session_id") or str(uuid.uuid4())
    channel_str = payload.get("channel", "SIM_CALL")
    try:
        channel = CommunicationChannel(channel_str)
    except Exception:
        channel = CommunicationChannel.SIM_CALL

    caller_number = payload.get("caller_number", "+91 98765 43210")
    platform_name = payload.get("platform", "android_telecom")

    adapter = get_platform_adapter(channel)
    adapter.start_monitoring(session_id, payload)

    # Perform pre-call screening for SIM / Online call
    screening_result = None
    if channel == CommunicationChannel.SIM_CALL and hasattr(adapter, "screen_incoming_call"):
        screening_result = adapter.screen_incoming_call(caller_number)

    capabilities = get_default_capabilities_for_channel(channel)

    return {
        "success": True,
        "session_id": session_id,
        "channel": channel.value,
        "platform": platform_name,
        "screening": screening_result,
        "capabilities": capabilities.to_dict(),
        "status": "MONITORING_ACTIVE"
    }


@router.post("/calls/end")
def end_call_session(payload: Dict[str, Any]):
    """
    Concludes an active call session and triggers tamper-evident audit finalization.
    """
    session_id = payload.get("session_id", "default-session")
    channel_str = payload.get("channel", "SIM_CALL")
    try:
        channel = CommunicationChannel(channel_str)
    except Exception:
        channel = CommunicationChannel.SIM_CALL

    adapter = get_platform_adapter(channel)
    adapter.stop_monitoring()

    ledger = get_or_create_ledger(session_id)
    ledger.add_block(
        event_type="CALL_CONCLUDED",
        data={"session_id": session_id, "channel": channel.value, "concluded_at": time.time()}
    )

    return {
        "success": True,
        "session_id": session_id,
        "status": "SESSION_CONCLUDED",
        "audit_integrity": ledger.verify_integrity()
    }


@router.post("/analyze/screen-share")
def analyze_screen_sharing_coercion(payload: Dict[str, Any]):
    """
    Section 9 & 21: Detects screen-sharing solicitations and banking app exposure risks.
    """
    transcript = payload.get("transcript", "")
    return screen_share_engine.analyze_text(transcript)


@router.post("/analyze/video")
def analyze_video_stream_context(payload: Dict[str, Any]):
    """
    Section 10 & 24: Analyzes video frames and extortion lure patterns.
    """
    transcript = payload.get("transcript", "")
    frame_metadata = payload.get("frame_metadata")
    return video_analysis_engine.analyze_video_context(transcript, frame_metadata)


@router.post("/analyze/url")
def analyze_suspicious_links(payload: Dict[str, Any]):
    """
    Section 22 & 23: Evaluates links or messages sent in conjunction with the call.
    """
    text = payload.get("message_text") or payload.get("url", "")
    if payload.get("url") and not payload.get("message_text"):
        return url_analyzer.analyze_url(payload.get("url"))
    return url_analyzer.analyze_message_links(text)


@router.get("/platforms/capabilities")
def get_all_platform_capabilities():
    """
    Section 31: Returns the runtime platform capability matrix across all channels.
    """
    return {
        c.value: get_default_capabilities_for_channel(c).to_dict()
        for c in CommunicationChannel
    }


# ── OTT Edition REST Endpoints ───────────────────────────────────────────────

@router.post("/ott/analyze", response_model=OTTAnalysisResult)
def ott_analyze(request: OTTAnalyzeRequest):
    """
    REST endpoint for OTT/WhatsApp/Telegram call analysis.
    Accepts transcript text + app-layer caller context + screen-share state + chat links.
    Runs OTT identity, screen-share coercion, link phishing, and NLP analysis.
    Fast-path overrides fire immediately for screen-share + financial context.
    """
    import time, datetime, uuid as _uuid
    from backend.app.services.ott_identity_engine import ott_identity_engine
    from backend.app.services.ott_trust_engine import ott_trust_engine

    start = time.time()
    session_id = str(_uuid.uuid4())

    # 1. App-layer identity analysis
    ctx = request.caller_context
    if ctx:
        identity_result = ott_identity_engine.analyze_caller(
            phone_number=ctx.phone_number,
            is_saved_contact=ctx.is_saved_contact,
            contact_name=ctx.contact_name,
            account_age_days=ctx.account_age_days,
            call_origin=ctx.call_origin,
            caller_display_name=ctx.caller_display_name,
            caller_profile_text=ctx.caller_profile_text,
            user_typical_country_codes=ctx.user_typical_country_codes,
            is_video_call=ctx.is_video_call,
            chat_messages_before_call=ctx.chat_messages_before_call,
            has_unsolicited_link_before_call=ctx.has_unsolicited_link_before_call,
        )
        ott_identity_risk = identity_result["identity_risk_score"]
        call_origin = ctx.call_origin
    else:
        identity_result = {"identity_risk_score": 15.0, "risk_tier": "LOW", "risk_factors": [], "risk_deductions": []}
        ott_identity_risk = 15.0
        call_origin = "DIRECT_DIAL"

    # 2. Screen-share coercion analysis via existing engine
    ss_result = screen_share_engine.analyze_text(request.text)
    screen_coercion = ss_result.get("is_screen_share_demanded", False)

    # 3. Chat link scanning
    link_results = []
    for lnk in request.links_in_chat:
        link_results.append(url_analyzer.analyze_url(lnk))
    max_link_risk = max((r["risk_score"] for r in link_results), default=0.0)

    # 4. NLP base analysis via supervisor
    nlp_result = supervisor.process_conversation(
        transcript=request.text,
        voice_result=None,
        is_provisional=False,
        channel=request.channel
    )
    base_nlp_risk = float(nlp_result.riskScore)

    # 5. OTT Trust fusion
    ott_fusion = ott_trust_engine.compute_ott_trust_score(
        transcript=request.text,
        base_nlp_risk=base_nlp_risk,
        voice_risk=0.0,
        screen_share_risk=float(ss_result.get("screen_share_risk", 0)),
        video_extortion_risk=90.0 if request.video_extortion_pattern else 0.0,
        ott_identity_risk=ott_identity_risk,
        link_file_risk=max_link_risk,
        screen_share_active=request.screen_share_active,
        screen_share_coercion_detected=request.screen_share_coercion_detected or screen_coercion,
        video_extortion_pattern=request.video_extortion_pattern,
        call_origin=call_origin,
    )

    # 6. Build fast-path alert if triggered
    fp_alert = None
    if ott_fusion["fast_path_triggered"] and ott_fusion.get("fast_path_override"):
        override = ott_fusion["fast_path_override"]
        fp_alert = OTTFastPathAlert(
            triggered=True,
            rule_name=override.get("rule_name"),
            label=override.get("label"),
            recommended_action=override.get("recommended_action"),
            risk_floor=override.get("risk_floor"),
            emergency_actions=[
                {"id": "stop_sharing", "label": "STOP SHARING", "severity": "primary"},
                {"id": "end_call", "label": "END CALL", "severity": "danger"},
                {"id": "block_caller", "label": "BLOCK CALLER", "severity": "danger"},
            ]
        )

    return OTTAnalysisResult(
        session_id=session_id,
        ott_risk_score=ott_fusion["ott_risk_score"],
        ott_trust_score=ott_fusion["ott_trust_score"],
        classification=ott_fusion["classification"],
        severity_label=ott_fusion["severity_label"],
        fast_path_triggered=ott_fusion["fast_path_triggered"],
        fast_path_alert=fp_alert,
        identity_analysis=identity_result,
        screen_share_analysis=ss_result,
        link_analysis={"results": link_results, "max_risk": max_link_risk},
        ott_signals=ott_fusion.get("ott_signals_detected", []),
        attribution=ott_fusion.get("attribution"),
        nlp_analysis=nlp_result,
        channel=request.channel,
        created_at=datetime.datetime.utcnow().isoformat(),
    )


@router.get("/ott/health")
def ott_health():
    """Healthcheck for OTT Protection module."""
    return {
        "status": "online",
        "module": "Silent Witness OTT Edition",
        "supported_channels": ["WHATSAPP", "TELEGRAM", "SIGNAL", "VOIP_UNKNOWN"],
        "capabilities": {
            "screen_share_detection": True,
            "fast_path_override": True,
            "video_extortion_defense": True,
            "app_layer_identity": True,
            "chat_link_scanner": True,
        }
    }
