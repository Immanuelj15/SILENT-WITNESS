# SYSTEM ARCHITECTURE: SILENT WITNESS

## 1. Architectural Philosophy
Silent Witness operates on the principle that modern voice fraud cannot be stopped solely through acoustic deepfake detection or post-call natural language processing. Real-world attackers blend cloned voices with social engineering tactics (urgency, intimidation, impersonation, credential harvesting).

Therefore, Silent Witness is constructed as a **real-time AI safety companion** operating continuously during a phone call.

```text
                 USER
                   │
                   ▼
             MICROPHONE
                   │
                   ▼
             AUDIO STREAM
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
   DEEPFAKE DETECTOR     WHISPER / STT
          │                 │
          │                 ▼
          │            TRANSCRIPT
          │                 │
          └────────┬────────┘
                   ▼
             AI SUPERVISOR
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
      SCAM       INTENT    IDENTITY
      AGENT      AGENT      AGENT
        │          │          │
        └──────────┼──────────┘
                   ▼
             EVIDENCE AGENT
                   │
                   ▼
             RISK ENGINE
                   │
                   ▼
             TRUST SCORE
                   │
                   ▼
             WEBSOCKET
                   │
                   ▼
           REACT DASHBOARD
                   │
                   ▼
             USER ACTION
```

---

## 2. Multi-Agent AI System

### 2.1 Scam Agent
- **Purpose:** Identifies psychological coercion, deadline urgency, panic induction, and threats.
- **Signals:** "within 1 hour", "police will be sent", "account blocked today", "digital arrest".

### 2.2 Intent Agent
- **Purpose:** Answers *"What is the caller trying to make the listener do?"*
- **Signals:** Solicitations for OTPs, UPI PINs, passwords, remote desktop tool installation (AnyDesk, TeamViewer), or wire transfers.

### 2.3 Identity Agent
- **Purpose:** Distinguishes claimed identity from verified identity.
- **Rule:** Claimed Identity ≠ Verified Identity. Unverified claims of authority (Bank Officer, Police, CBI, Judge) immediately elevate the identity risk component.

### 2.4 Evidence Agent
- **Purpose:** Grounding and hallucination rejection.
- **Rule:** Every agent finding must link to a verbatim or fuzzy-matched quote from the live transcript. Unsupported deductions are discarded as `UNKNOWN`.

### 2.5 Supervisor Agent
- **Purpose:** Reconciles sub-agent findings, records discrepancies between agents, calls the deterministic risk engine, and maps to the 18-class scam taxonomy.

---

## 3. Deterministic Risk & Trust Engine

### 3.1 Transparent Formula
The system rejects opaque black-box scoring in favor of a deterministic, configurable weighted formula:

$$\text{Weighted Risk} = w_v \cdot V + w_s \cdot S + w_i \cdot I + w_{id} \cdot ID + w_t \cdot T$$

Where:
- $V$ = Voice Acoustic Deepfake Risk ($w_v = 35\%$)
- $S$ = Social Engineering & Urgency Risk ($w_s = 25\%$)
- $I$ = Fraud Intent & Credential Solicitation Risk ($w_i = 20\%$)
- $ID$ = Unverified Identity Claim Risk ($w_{id} = 10\%$)
- $T$ = Threat & Legal Intimidation Risk ($w_t = 10\%$)

$$\text{Trust Score} = 100 - \text{Weighted Risk}$$

### 3.2 High-Severity Overrides
If an active OTP solicitation occurs concurrently with urgency or intimidation, the system activates an algorithmic floor ensuring the Risk Score cannot fall below $88$ ($\text{Trust Score} \le 12$), preventing a clean voice recording from masking an obvious fraud attempt.

---

## 4. Acoustic Voice Deepfake Detection Pipeline
- **Spectral Centroid:** Measures frequency mass shift indicative of neural vocoder artifacts.
- **Spectral Flatness:** Detects unnatural noise-floor flattening or phase distortion.
- **Pitch Jitter & Shimmer:** Measures micro-instability across fundamental periods. Unnaturally rigid pitch contours ($\text{jitter} < 0.05\%$) indicate neural text-to-speech engines.
- **Non-discriminatory Processing:** Accents, speaking speeds, and pitch ranges are strictly filtered from fraud scoring.
