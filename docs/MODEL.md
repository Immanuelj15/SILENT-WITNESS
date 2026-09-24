# MODEL & AI REASONING SPECIFICATION: SILENT WITNESS

## 1. Multi-Agent Design vs. Monolithic LLM
Monolithic LLMs often exhibit three critical failure modes when analyzing live phone fraud:
1. **Hallucination:** Fabricating that a caller asked for money when they only mentioned a routine balance inquiry.
2. **False Authority Blindness:** Believing caller claims of being "Inspector Sharma from CBI" or "SBI fraud division" simply because the caller sounded authoritative.
3. **Prompt Injection Susceptibility:** Being tricked by spoken conversational directives into declaring a call legitimate.

Silent Witness solves this through a segregated **Multi-Agent Architecture**:

```text
[Input Transcript]
       │
       ├─► [Scam Agent]     ──► Detects Urgency, Intimidation, Deadline pressure
       ├─► [Intent Agent]   ──► Extracts Demands (OTP, PIN, Transfer, AnyDesk)
       ├─► [Identity Agent] ──► Identifies Impersonation (Enforces Claimed ≠ Verified)
       │
       ▼
[Evidence Agent]
       │ (Verifies verbatim quotes; discards unsupported hallucinations)
       ▼
[Supervisor Agent]
       │ (Surface agent disagreements; structure audit report)
       ▼
[Deterministic Risk Engine]
       │ (Computes Trust Score = 100 - Weighted Risk; High-severity floors)
       ▼
[Final Decision: Safe / Suspicious / Likely Scam]
```

---

## 2. Acoustic Feature Extraction Pipeline
The deepfake analysis engine inspects low-level physical characteristics rather than relying purely on proprietary cloud APIs:
- **Welch Power Spectral Density:** Generates spectral power distributions to compute Spectral Centroid (brightness) and Flatness.
- **Spectral Flatness (Wiener Entropy):** Ratio of geometric mean to arithmetic mean of power spectrum. Neural vocoders typically suppress micro-frequency variability, producing elevated flatness.
- **Autocorrelation F0 Tracking:** Detects fundamental voice frequency and measures period-to-period variability (Jitter) and cycle amplitude variation (Shimmer). Robotic monotony ($\text{jitter} < 0.05\%$) or erratic phase glitches ($\text{jitter} > 8\%$) trigger synthetic voice warnings.

---

## 3. Local Model Deployment (llama.cpp / Nemotron-3-Nano-4B)
The backend is architected to seamlessly interface with local small language models via standard OpenAI-compatible endpoints:
- **Model:** `Nemotron-3-Nano-4B-GGUF`
- **Engine:** `llama-server` / `llama.cpp`
- **Context Window:** 2048 tokens
- **Quantization:** Q4_K_M or Q5_K_M
- **Latency:** ~40ms to 120ms per chunk analysis, preserving real-time responsiveness without cloud transmission.
