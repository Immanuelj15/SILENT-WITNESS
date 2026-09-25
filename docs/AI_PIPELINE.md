# SILENT WITNESS — REAL-TIME AI & MULTI-AGENT PIPELINE

> **Core Axiom:** *“LLMs reason. Evidence verifies. Deterministic rules decide.”*

---

## 1. End-to-End Processing Flow

```text
Audio Stream / Text Dialogue / Video Frames
                  │
                  ▼
         Signal Collector Layer
    ┌─────────────┼──────────────┐
    ▼             ▼              ▼
Audio Analysis  Transcript     Video Analysis
(Acoustic DSP)  (Whisper STT)  (Face/Lip-Sync)
    │             │              │
    └─────────────┼──────────────┘
                  ▼
      Multi-Agent Reasoning Core
    ┌─────────────┼──────────────┐
    │  • Scam Agent              │
    │  • Intent Agent            │
    │  • Identity Agent          │
    │  • Social Engineering Agent│
    │  • Screen Share Agent      │
    │  • Video Agent             │
    └─────────────┬──────────────┘
                  ▼
         Evidence Verification
     (Transcript Grounding Guard)
                  ▼
       Deterministic Risk Engine
    (Transparent Prototype Weights)
                  ▼
             TRUST SCORE
       (Trust = 100 - Risk)
                  ▼
         Intervention Engine
  (In-Call Coaching & Emergency Modals)
```

---

## 2. Multi-Agent Reasoning Architecture

| Specialized Agent | Responsibilities | Key Signals Evaluated |
| :--- | :--- | :--- |
| **Scam Agent** | Pattern matching against 17 scam categories | Known phrases, script fingerprints, Indian fraud indicators |
| **Intent Agent** | Identifies caller demands and targets | OTP, UPI PIN, bank credentials, KYC update, remote tool download |
| **Identity Agent** | Distinguishes claims from verification | Entity claiming vs. official registry verification status |
| **Social Engineering Agent** | Psychological manipulation detection | Artificial urgency, fear, isolation, authority pressure, legal threats |
| **Screen Share Agent** | Screen takeover coercion analysis | AnyDesk, TeamViewer, QuickSupport, screen sharing + banking app |
| **Video Agent** | Visual deepfake & extortion analysis | Lip-sync mismatch, face temporal mesh artifacts, blackmail lures |
| **Supervisor Agent** | Synthesis, consensus, and contradiction | Reconciles disagreements, grounds evidence in verbatim transcript |

---

## 3. Deterministic Trust Score Formula

The Trust Score is calculated as:
$$\text{Trust Score} = 100 - \text{Risk Score}$$

Where Risk Score is a weighted combination with high-severity deterministic overrides:

```text
Voice Authenticity Risk       25%
Social Engineering Risk      20%
Fraud Intent Risk             20%
Identity Unverified Risk      15%
Sensitive Request Risk        10%
Screen / Visual Risk          10%
```

### Critical Override Floors
* **OTP Solicitation under Urgency:** Immediate floor of **85.0** (Trust $\le$ 15).
* **Screen Sharing + Banking/Credential Coercion:** Immediate floor of **92.0** (Trust $\le$ 8).
* **Video Blackmail / Extortion Threat:** Immediate floor of **90.0** (Trust $\le$ 10).
* **Digital Arrest / Law Enforcement Impersonation:** Immediate floor of **88.0** (Trust $\le$ 12).
