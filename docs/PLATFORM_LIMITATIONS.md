# SILENT WITNESS — PLATFORM CAPABILITY & TECHNICAL LIMITATIONS

> **Core Axiom:** *Technical honesty is a security requirement. Silent Witness never falsifies call audio interception, fake video deepfake analysis, or guaranteed caller verification.*

---

## 1. Executive Summary

Operating system boundaries (Android, iOS) and messaging security architectures (WhatsApp, Signal, Telegram) deliberately restrict third-party background applications from capturing raw audio from other phone or VoIP calls. 

Silent Witness is architected to operate within OS-supported security models without bypassing platform sandboxes or using prohibited private APIs.

```text
+-----------------------------------------------------------------------------------+
|                           CHANNEL CAPABILITY MATRIX                               |
+---------------------------+-----------+------------------+------------+-----------+
| Security Capability       | SIM Call  | WhatsApp/Online  | Video Call | Own WebRTC|
+---------------------------+-----------+------------------+------------+-----------+
| Caller Screening          | ACTIVE    | CONDITIONAL      | CONDITIONAL| ACTIVE    |
| Caller ID Metadata        | ACTIVE    | CONDITIONAL      | CONDITIONAL| ACTIVE    |
| Audio Stream Capture      | OS DEPEND.| PLATFORM RESTRICT| OS DEPEND. | ACTIVE    |
| Streaming Speech-to-Text  | CONDITIONAL| CONDITIONAL     | CONDITIONAL| ACTIVE    |
| Voice Authenticity Model  | CONDITIONAL| CONDITIONAL     | CONDITIONAL| ACTIVE    |
| Video Deepfake Analysis   | N/A       | CONDITIONAL      | ACTIVE     | ACTIVE    |
| Screen Share Coercion Mon.| N/A       | ACTIVE (Access.) | ACTIVE     | ACTIVE    |
| Full Multi-Agent Risk Eng.| ACTIVE    | ACTIVE           | ACTIVE     | ACTIVE    |
+---------------------------+-----------+------------------+------------+-----------+
```

---

## 2. SIM Cellular Call Protection (Mode A)

### Supported Capabilities
* **Android `CallScreeningService`:** Intercepts incoming cellular calls before the handset rings.
* **Carrier & Number Verification:** Evaluates international dial codes, known voip/disposable ranges, and reputation flags.
* **Call Actions:** Programmatically allow, silence, or block fraudulent numbers at the OS level.
* **In-Call Audio:** If the user routes cellular audio through a supported accessory or accessibility audio bridge, real-time STT and acoustic deepfake detection activate.

### Technical Limitations
* Android does **not** grant unconstrained background recording of normal two-way cellular audio to standard Play Store applications without explicit accessibility services or carrier telephony integration.
* Silent Witness displays `Voice Analysis: Conditional (Stream Required)` when cellular audio is not routed through a supported stream.

---

## 3. WhatsApp & Online Third-Party Call Protection (Mode B)

### Supported Capabilities
* **Screen-Sharing Scam Monitoring:** Monitors OS accessibility events and display capture state to detect when screen-sharing tools (WhatsApp Screen Share, AnyDesk, TeamViewer, QuickSupport) are triggered.
* **Post-Call Recorded Analysis:** Analyzes user-provided audio notes, exported call recordings, or companion desktop sessions.
* **Conversational Context Rules:** Real-time multi-agent reasoning over user-entered or companion-streamed dialogue.
* **Suspicious Link / APK Protection:** Scans malicious links and lookalike phishing domains sent in companion chat threads during a call.

### Technical Limitations
* **Zero Raw Audio Interception:** WhatsApp uses end-to-end encryption (Signal Protocol). Android sandbox policies prevent third-party apps from tapping into WhatsApp's private VoIP audio stream.
* Silent Witness **never** claims to covertly record WhatsApp audio. It clearly marks WhatsApp audio interception as:
  ```json
  "audioCapture": "PLATFORM_RESTRICTED"
  ```

---

## 4. Own-VoIP Mode (WebRTC Secure Call)

### Supported Capabilities
* **Full Direct Media Control:** User-to-user audio and video streams flow directly through the Silent Witness WebRTC media pipeline.
* **Real-Time Acoustic Deepfake Detection:** 100ms continuous chunking, spectral analysis, jitter/shimmer, and synthetic artifact scoring.
* **Streaming Whisper STT:** Sub-second partial and final transcript updates via WebSocket.
* **Visual Manipulation Detection:** Face mesh tracking, temporal consistency checks, and lip-sync mismatch scoring.
* **Emergency Intervention Engine:** Instantaneous in-call coaching overlays and one-tap call termination.

---

## 5. Summary of Truthful Disclosures

1. **No 100% Guarantees:** Deepfake probability is reported as a calibrated risk signal (e.g., `78% deepfake risk, 0.84 confidence`), never "100% AI Voice."
2. **Caller ID ≠ Verified Identity:** A verified phone number or caller ID text is an unverified claim until backed by official registry signatures.
3. **Data Privacy Defaults:** Audio and video frames are never stored to permanent disk by default. Analysis is ephemeral and streaming.
