# SILENT WITNESS — ANDROID ARCHITECTURE & INTEGRATION

> **Tagline:** *“Don’t trust the voice. Verify the conversation.”*

---

## 1. Android Subsystem Architecture

The native Android layer is implemented in Kotlin under `android/app/src/main/kotlin/com/silentwitness/` and coordinates with the Silent Witness backend intelligence layer over WSS (WebSocket Secure) and HTTPS.

```text
Android Handset
│
├── CallScreeningServiceImpl (Mode A: Native SIM Screening)
│   ├── onScreenCall()
│   ├── CallerReputationEngine
│   └── CallResponse (Allow / Silence / Disallow)
│
├── PlatformCapabilityDetector (Runtime Matrix)
│   ├── detectCapabilities(channel)
│   └── enforceTechnicalHonesty()
│
├── ScreenShareDetector (Screen Coercion Shield)
│   ├── AccessibilityEvent listener
│   ├── MediaProjectionManager monitor
│   └── AlertNotificationManager
│
├── PermissionManager
│   ├── BIND_SCREENING_SERVICE
│   ├── POST_NOTIFICATIONS
│   ├── READ_PHONE_STATE
│   └── RECORD_AUDIO (Explicit user toggle)
│
└── WebSocketClient
    ├── WSS stream to /ws/calls/{session_id}
    └── Sub-second reactive UI update
```

---

## 2. Mode A: Native Cellular Call Screening

Implemented in `android/app/src/main/kotlin/com/silentwitness/callscreening/CallScreeningServiceImpl.kt`.

```kotlin
class CallScreeningServiceImpl : CallScreeningService() {
    override fun onScreenCall(callDetails: Call.Details) {
        val handle = callDetails.handle
        val rawNumber = handle?.schemeSpecificPart ?: ""
        
        // Asynchronous check against reputation cache
        val assessment = evaluateInboundNumber(rawNumber)
        
        val response = CallResponse.Builder().apply {
            if (assessment.isSevereRisk) {
                setDisallowCall(true)
                setRejectCall(true)
                setSkipCallLog(false)
                setSkipNotification(false)
            } else if (assessment.isSuspicious) {
                setSilenceCall(true)
            }
        }.build()
        
        respondToCall(callDetails, response)
    }
}
```

---

## 3. Mode B: Accessibility & Screen-Share Detection

Implemented in `android/app/src/main/kotlin/com/silentwitness/screenshare/ScreenShareDetector.kt`.

* **Remote Access Tools Monitored:** AnyDesk (`com.anydesk.anydeskandroid`), TeamViewer QuickSupport (`com.teamviewer.quicksupport.market`), WhatsApp Screen Sharing, and Google Meet screen share.
* **Sensitive Foreground App Shield:** When screen capture is active and a banking application or SMS verification activity moves to the foreground, Silent Witness immediately triggers the emergency full-screen warning modal:
  > **🚨 STOP — SCREEN SHARING RISK DETECTED**
  > *The caller is asking you to expose sensitive information. Do not share your screen or OTP.*

---

## 4. Permission Transparency Model

Every Android permission requested includes an explainable rationale:
1. `BIND_SCREENING_SERVICE`: Mandatory to screen inbound SIM calls before ringing.
2. `READ_PHONE_STATE`: Reads caller carrier and country metadata.
3. `POST_NOTIFICATIONS`: Delivers instant warning banners if risk rises above 40 (MEDIUM).
4. `RECORD_AUDIO`: Optional; only engaged during Secure Own-VoIP or user-initiated live monitoring.
