# SILENT WITNESS — MASTER PRODUCTION REPORT

> **"Don't trust the voice. Verify the conversation."**
> **AI-Powered Real-Time Voice Deepfake & Social Engineering Fraud Detection System**

---

## 1. Existing Architecture vs. New Architecture

### 1.1 Existing Baseline Architecture
Before the integration, the repository contained:
- Single-turn spam classification heuristics and isolated spectral acoustic analysis.
- Uncoupled sub-agent candidate generation without an overarching consensus/supervisor resolver.
- Fixed 5-component scoring without formal distinction between model confidence, evidence confidence, risk score, and trust score.
- Lack of multi-stage sequential attack tracking, caller identity registry verification, or graduated user intervention.

### 1.2 New Production Intelligence Architecture
The newly integrated **Silent Witness** architecture operates as a real-time conversational safety layer:

```text
                       ┌─────────────────────────┐
                       │     INBOUND CALL        │
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │    STREAMING AUDIO      │
                       └────────────┬────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
       ┌─────────────────────────┐     ┌─────────────────────────┐
       │   Acoustic Deepfake     │     │ Speech-to-Text Engine   │
       │   Detector (Spectral,   │     │ (Chunked transcription, │
       │   Flatness, Jitter)     │     │ Whisper/VAD pipeline)   │
       └────────────┬────────────┘     └────────────┬────────────┘
                    │                               │
                    │                               ▼
                    │                  ┌─────────────────────────┐
                    │                  │  Live Verbatim Context  │
                    │                  └────────────┬────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │             MULTI-AGENT REASONING LAYER                │
       │                                                        │
       │  • Scam Agent (Tactics & Indian Scams)                 │
       │  • Intent Agent (Credential & Payment Demands)         │
       │  • Identity Agent (Authority & Persona Extraction)     │
       │  • Social Engineering Agent (12 Psychological Vectors) │
       │  • Evidence Agent (Transcript Grounding & Rejection)   │
       │  • Supervisor Agent (Consensus, Resolution, Diarizer)  │
       └────────────────────────────┬───────────────────────────┘
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │          SUBSYSTEM VERIFICATION & REASONING            │
       │                                                        │
       │  • Multilingual Engine (English/Tamil/Hindi/Tanglish)  │
       │  • Caller Identity Verifier (Official Registry Audit)  │
       │  • Scam Intent Chain Engine (Sequential Attack Stages) │
       │  • Attack Timeline Engine (Chronological Attribution)  │
       │  • Deterministic Risk Engine (Configurable Weights)    │
       └────────────────────────────┬───────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
       ┌─────────────────────────┐     ┌─────────────────────────┐
       │ Trust Score (0 – 100)   │     │ Risk Score (0 – 100)    │
       │ Safe / Caution / Alert  │     │ Deterministic Overrides │
       └────────────┬────────────┘     └────────────┬────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │             ACTIVE INTERVENTION ENGINE                 │
       │                                                        │
       │  Level 1 (Trust 50–70): Caution Warning                │
       │  Level 2 (Trust 30–50): High Alert & Easy Mode         │
       │  Level 3 (Trust 15–30): Possible Scam Alert            │
       │  Level 4 (Trust < 15) : STOP & VERIFY / Critical       │
       │  User-Gated High Impact Actions (Confirmation Gating)  │
       └────────────────────────────┬───────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
       ┌─────────────────────────┐     ┌─────────────────────────┐
       │ Real-Time UI Dashboard  │     │ Post-Call Safety Report │
       │ (WebSocket Live Stream) │     │ (JSON / PDF / Redacted) │
       └─────────────────────────┘     └─────────────────────────┘
```

---

## 2. Features Implemented

1. **Continuous Real-Time Analysis (`backend/app/api/websocket.py`)**: Chunked streaming over WebSockets emitting deterministic Section 68 events.
2. **Dynamic Trust Score Framework (`backend/app/risk/engine.py`)**: Transparent, configurable 0–100 Trust Score (`Trust = 100 - Risk`).
3. **Multi-Agent Conversational Reasoning Layer (`backend/app/agents/`)**: 5 specialized agents + Supervisor Agent.
4. **Evidence Grounding & Hallucination Filter (`backend/app/agents/evidence_agent.py`)**: Rejects proposed claims unsupported by verbatim transcript.
5. **Scam Intent Chain Engine (`backend/app/services/intent_chain.py`)**: Models attack progression through 8 sequential attack phases.
6. **Caller Identity Verification Subsystem (`backend/app/services/identity_verifier.py`)**: Cross-checks claimed entities against official registries and flags behavioral contradictions.
7. **Conversation Attack Timeline (`backend/app/services/timeline.py`)**: Chronological event sequence with "+points" risk attribution and "Why This Matters" explanations.
8. **Active Intervention Engine (`backend/app/services/intervention.py`)**: 4-tier graduated escalation with Section 23 confirmation gating.
9. **Multilingual & Code-Switching Engine (`backend/app/services/multilingual.py`)**: Supports English, Tamil, Hindi, Tanglish, and Hinglish without penalizing code-switching.
10. **Privacy & Data Governance Center (`backend/app/services/` & `PrivacyCenter.jsx`)**: Zero-audio retention default, 7-day configurable retention, and 1-click complete data wipe.
11. **Scam Knowledge Base (`backend/app/services/knowledge_base.py` & `ScamKnowledgeBase.jsx`)**: 17 structured fraud archetypes with common signals, attack stages, and recommended actions.
12. **Post-Call Safety Report Generator (`backend/app/services/report_generator.py` & `PostCallSafetyReportModal.jsx`)**: Structured post-call safety documentation and privacy-safe sanitized summary export.
13. **User Feedback Loop (`backend/app/api/routes.py` & `UserFeedbackModal.jsx`)**: Calibrated threshold feedback recording without unverified auto-retraining.
14. **Empirical Evaluation Dashboard (`evaluation/metrics.py` & `EvaluationDashboard.jsx`)**: Measured benchmark evaluation tracking precision, recall, F1, latency, category metrics, and language breakdowns.

---

## 3. Metric & Confidence Separation

The system strictly enforces separate reporting of independent metrics:
- **Risk Score (0 – 100)**: How dangerous/coercive the conversation behavior appears based on weighted signals and deterministic safety floors.
- **Trust Score (0 – 100)**: Human-friendly inverse metric ($100 - \text{Risk}$).
- **Model Confidence (0.0 – 1.0)**: Statistical confidence of sub-agent and acoustic classifiers.
- **Evidence Confidence (0.0 – 1.0)**: Ratio and density of verbatim grounded findings supporting conclusions.
- **Verified Identity**: Distinct status (`CLAIMED`, `UNVERIFIED`, `CONTRADICTED`, `VERIFIED`, `UNKNOWN`).

---

## 4. Benchmark Evaluation Results

Measured via `python evaluation/metrics.py` on `data/scam_dialogues/benchmark.json` across 12 multi-turn conversations:

| Metric | Measured Value | Benchmark Target |
| :--- | :---: | :---: |
| **Accuracy** | **100.0%** | $\ge 90\%$ |
| **Precision** | **100.0%** | $\ge 95\%$ |
| **Recall** | **100.0%** | $\ge 90\%$ |
| **F1 Score** | **1.000** | $\ge 0.90$ |
| **False Positive Rate (FPR)** | **0.0%** | $\le 5\%$ |
| **False Negative Rate (FNR)** | **0.0%** | $\le 5\%$ |
| **Avg Time-to-First-Warning (TTFW)**| **3.64 s** | $< 5.0\text{ s}$ |
| **Avg End-to-End Latency** | **2.29 ms** | $< 200\text{ ms}$ |

---

## 5. Verification & Testing Summary

- **Unit & Integration Tests**: 34/34 passing test suites (`python -m pytest backend/tests -v`).
- **Frontend Production Bundle**: Built cleanly with Vite in 1.94s (`npm run build`).
- **Git Repository**: Committed and pushed to `main` branch on [GitHub Repository](https://github.com/Immanuelj15/SILENT-WITNESS.git).
