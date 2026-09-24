# REST & WEBSOCKET API SPECIFICATION: SILENT WITNESS

## Base URLs
- **REST:** `http://localhost:8000/api`
- **WebSocket:** `ws://localhost:8000/ws/live-call`

---

## 1. REST Endpoints

### 1.1 `GET /api/health`
Health check and system status.
**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "Silent Witness AI Real-Time Voice Fraud Detector",
  "timestamp": "2026-09-24T17:15:00.000000",
  "version": "1.0.0"
}
```

---

### 1.2 `POST /api/analyze-text`
Analyzes conversation transcripts directly through the Multi-Agent system and deterministic risk engine. Independent of audio input for testing, simulation, and prompt-injection screening.

**Request:**
```json
{
  "text": "I am calling from your bank. Your account will be blocked today. Tell me the OTP immediately."
}
```

**Response (200 OK):**
```json
{
  "id": "c1f77f59-3a6d-4eb4-b91b-1793ea5b0451",
  "success": true,
  "classification": "LIKELY_SCAM",
  "riskScore": 88,
  "trustScore": 12,
  "confidence": 0.89,
  "category": "OTP Scam",
  "transcript": "I am calling from your bank. Your account will be blocked today. Tell me the OTP immediately.",
  "is_provisional": false,
  "riskFactors": [
    "OTP / Credential Request",
    "Urgency & Psychological Pressure",
    "Threat / Intimidation",
    "Unverified Claim: Bank Representative"
  ],
  "suspiciousPhrases": [
    "account will be blocked",
    "tell me the otp",
    "immediately",
    "your bank"
  ],
  "evidence": [
    {
      "exact_phrase": "account will be blocked",
      "detected_tag": "Threat",
      "is_grounded_in_transcript": true,
      "context_note": "Pressure tactic detected"
    }
  ],
  "recommendation": "STOP AND VERIFY",
  "actions": [
    "DO NOT SHARE OTP OR PIN",
    "END CALL IMMEDIATELY",
    "VERIFY THROUGH OFFICIAL CHANNEL"
  ],
  "easyModeSummary": "🚨 DANGER: This is almost certainly a scam call! Hang up immediately.",
  "aiExplanation": "The call shows dangerous signals: OTP request, urgency, and bank impersonation. Never share security codes.",
  "latency_ms": 14.5
}
```

---

### 1.3 `POST /api/analyze-audio`
Uploads and processes recorded audio files (WAV, MP3, M4A, WebM, OGG up to 25MB). Executes acoustic deepfake detection, speech-to-text, and conversational risk scoring.

**Request:**
- `multipart/form-data`
- `file`: binary audio data

**Response:** Returns `AnalysisResult` schema including `voiceAnalysis` acoustic features.

---

### 1.4 `GET /api/history`
Retrieves recent call session summaries.
**Response (200 OK):**
```json
[
  {
    "id": "c1f77f59-3a6d-4eb4-b91b-1793ea5b0451",
    "created_at": "2026-09-24T17:15:00.000000",
    "classification": "LIKELY_SCAM",
    "riskScore": 88,
    "trustScore": 12,
    "category": "OTP Scam",
    "duration_sec": 0.0,
    "snippet": "I am calling from your bank. Your account will be blocked..."
  }
]
```

---

### 1.5 `GET /api/stats`
Aggregated telemetry metrics for cybersecurity dashboard.
**Response (200 OK):**
```json
{
  "total_calls": 24,
  "safe_calls": 18,
  "suspicious_calls": 3,
  "high_risk_calls": 3,
  "average_trust_score": 82.5
}
```

---

### 1.6 `GET /api/demo/scenario`
Retrieves pre-loaded multi-step simulation scenarios (Bank OTP Scam, Digital Arrest, Legitimate UPI Transfer).

---

## 2. WebSocket Real-Time Stream

### `ws://localhost:8000/ws/live-call`

#### Client to Server Messages:
```json
{
  "type": "TEXT_CHUNK",
  "text": "Your account will be blocked today.",
  "isFinal": false
}
```
Or with audio chunk:
```json
{
  "type": "AUDIO_CHUNK",
  "audioBase64": "<base64_pcm_data>",
  "isFinal": false
}
```

#### Server to Client Messages:
```json
{
  "type": "LIVE_UPDATE",
  "sessionId": "b47c050c-e2f0-4fc7-b089-61bf6a8a2523",
  "chunkIndex": 3,
  "isProvisional": true,
  "timestamp": "2026-09-24T17:16:02.000000",
  "analysis": { ...AnalysisResult... }
}
```
