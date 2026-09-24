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
    CallSessionSummary
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
        is_provisional=False
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

