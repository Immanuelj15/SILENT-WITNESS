package com.silentwitness.network

import android.util.Log
import com.google.gson.Gson
import com.silentwitness.data.ThreatVerdict
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.*
import java.util.UUID
import java.util.concurrent.TimeUnit

enum class ConnectionStatus {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    ERROR
}

class WebSocketClientManager(
    private val host: String = if (isEmulatorDevice()) "10.0.2.2" else "127.0.0.1",
    private val port: Int = 8000
) {
    companion object {
        private const val TAG = "WebSocketClientMgr"
        val instance by lazy { WebSocketClientManager() }

        private fun isEmulatorDevice(): Boolean {
            return (android.os.Build.FINGERPRINT.startsWith("generic")
                    || android.os.Build.MODEL.contains("google_sdk")
                    || android.os.Build.MODEL.contains("Emulator")
                    || android.os.Build.HARDWARE.contains("goldfish")
                    || android.os.Build.HARDWARE.contains("ranchu"))
        }
    }

    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .pingInterval(15, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private var webSocket: WebSocket? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private val _connectionState = MutableStateFlow(ConnectionStatus.DISCONNECTED)
    val connectionState: StateFlow<ConnectionStatus> = _connectionState.asStateFlow()

    private val _latestVerdict = MutableStateFlow<ThreatVerdict?>(null)
    val latestVerdict: StateFlow<ThreatVerdict?> = _latestVerdict.asStateFlow()

    private val _auditHistory = MutableStateFlow<List<ThreatVerdict>>(emptyList())
    val auditHistory: StateFlow<List<ThreatVerdict>> = _auditHistory.asStateFlow()

    var activeSessionId: String = UUID.randomUUID().toString()
        private set

    private val candidateHosts = listOf(host, "127.0.0.1", "10.106.45.133", "10.0.2.2").distinct()
    private var hostAttemptIndex = 0

    fun connect(customHost: String? = null, customPort: Int? = null) {
        if (_connectionState.value == ConnectionStatus.CONNECTED) return

        val targetHost = customHost ?: candidateHosts[hostAttemptIndex % candidateHosts.size]
        val targetPort = customPort ?: port
        activeSessionId = UUID.randomUUID().toString()

        val url = "ws://$targetHost:$targetPort/ws/live-call/$activeSessionId"
        Log.i(TAG, "Connecting to Guardian WebSocket: $url")
        _connectionState.value = ConnectionStatus.CONNECTING

        val request = Request.Builder().url(url).build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                Log.i(TAG, "WebSocket connected successfully to session: $activeSessionId")
                _connectionState.value = ConnectionStatus.CONNECTED
            }

            override fun onMessage(ws: WebSocket, text: String) {
                try {
                    val verdict = gson.fromJson(text, ThreatVerdict::class.java)
                    if (verdict != null && verdict.threatLevel.isNotEmpty()) {
                        _latestVerdict.value = verdict
                        // Append to audit history if it contains a cryptographic hash
                        if (verdict.auditHash.isNotEmpty()) {
                            val currentList = _auditHistory.value.toMutableList()
                            currentList.add(0, verdict)
                            _auditHistory.value = currentList
                        }
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Non-verdict or malformed frame: ${e.message}")
                }
            }

            override fun onClosing(ws: WebSocket, code: Int, reason: String) {
                Log.i(TAG, "WebSocket closing: $reason")
                _connectionState.value = ConnectionStatus.DISCONNECTED
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                Log.i(TAG, "WebSocket closed")
                _connectionState.value = ConnectionStatus.DISCONNECTED
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket failure: ${t.message}")
                _connectionState.value = ConnectionStatus.ERROR
                hostAttemptIndex++
                val nextHost = candidateHosts[hostAttemptIndex % candidateHosts.size]
                Log.i(TAG, "Scheduling WebSocket retry with host: $nextHost")
                scope.launch {
                    delay(2500)
                    connect(nextHost)
                }
            }
        })

        // Ping keepalive coroutine
        scope.launch {
            while (_connectionState.value == ConnectionStatus.CONNECTED) {
                delay(12000)
                try {
                    webSocket?.send(gson.toJson(mapOf("type" to "PING")))
                } catch (e: Exception) {
                    break
                }
            }
        }
    }

    fun sendSpeechSnippet(text: String, isFinal: Boolean = false, callerMetadata: Map<String, Any> = emptyMap()) {
        val payload = mapOf(
            "type" to "TEXT_CHUNK",
            "text" to text,
            "isFinal" to isFinal,
            "callerMetadata" to callerMetadata
        )
        val json = gson.toJson(payload)
        val sent = webSocket?.send(json) ?: false

        // If backend link is not connected or send fails, execute on-device offline pattern matching
        if (!sent || _connectionState.value != ConnectionStatus.CONNECTED) {
            Log.i(TAG, "Offline mode / backend link unavailable: running on-device offline scam pattern matching")
            val offlineVerdict = evaluateOfflineScamPattern(text, callerMetadata)
            injectLocalVerdict(offlineVerdict)
        }
    }

    fun evaluateOfflineScamPattern(text: String, callerMetadata: Map<String, Any> = emptyMap()): ThreatVerdict {
        val lower = text.lowercase()
        val timeStr = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.US).format(java.util.Date())

        val (threatLevel, riskScore, scamType, directives, explanation) = when {
            listOf("digital arrest", "mumbai police", "cbi", "cyber crime", "narcotics", "arrest warrant", "cannot hang up", "stay on video").any { lower.contains(it) } -> {
                Tuple5(
                    "CRITICAL",
                    96,
                    "Digital Arrest / Law Enforcement Extortion",
                    listOf(
                        "CRITICAL: Digital arrest does NOT exist in Indian or international law.",
                        "Police, CBI, and Customs NEVER conduct arrests over video/phone calls.",
                        "Do NOT transfer funds for 'verification' or security clearance.",
                        "Terminate call immediately and dial Cyber Crime Helpline 1930."
                    ),
                    "On-device engine: Suspected law enforcement impersonation and digital arrest extortion."
                )
            }
            listOf("anydesk", "teamviewer", "rustdesk", "quicksupport", "screen share", "share screen", "9 digit code", "download quicksupport").any { lower.contains(it) } -> {
                Tuple5(
                    "CRITICAL",
                    94,
                    "Remote Access Coercion",
                    listOf(
                        "CRITICAL: Caller is instructing you to install remote access tools.",
                        "NEVER download AnyDesk, TeamViewer, or RustDesk on call.",
                        "Do NOT share the 9-digit remote connection code.",
                        "Stop screen sharing immediately and disconnect."
                    ),
                    "On-device engine: High-risk screen sharing and remote desktop coercion detected."
                )
            }
            listOf("customs", "consignment", "parcel seized", "clearance fee", "penalty clearance", "illegal parcel").any { lower.contains(it) } -> {
                Tuple5(
                    "CRITICAL",
                    93,
                    "Customs Seizure Consignment Extortion",
                    listOf(
                        "CRITICAL: Customs departments NEVER demand clearance fees over phone calls.",
                        "Do NOT transfer money to personal bank accounts or UPI IDs.",
                        "Legitimate customs notices are served via official government postal mail.",
                        "Disconnect immediately and report to 1930."
                    ),
                    "On-device engine: Extortion falsely alleging consignment seizure and demanding clearance fee."
                )
            }
            listOf("otp", "one time password", "kyc", "account blocked", "pan card expired", "share otp", "verify otp", "cvv").any { lower.contains(it) } -> {
                Tuple5(
                    "HIGH",
                    88,
                    "Financial OTP / KYC Expiration Scam",
                    listOf(
                        "HIGH RISK: Banks and service providers NEVER demand OTPs over phone calls.",
                        "Do NOT read out the 4-digit or 6-digit OTP received via SMS.",
                        "Legitimate organizations do not suspend accounts without formal notice.",
                        "Call the official number printed on the back of your debit card."
                    ),
                    "On-device engine: Urgent pressure detected demanding 2FA credentials or KYC renewal."
                )
            }
            else -> {
                Tuple5(
                    "SAFE",
                    5,
                    "Routine Conversation",
                    listOf(
                        "Conversation shows standard conversational patterns.",
                        "Maintain normal vigilance regarding personal credentials."
                    ),
                    "On-device engine: Baseline safety verified. No malicious indicators found."
                )
            }
        }

        val auditHash = java.security.MessageDigest.getInstance("SHA-256")
            .digest("$scamType:$riskScore:$timeStr".toByteArray())
            .joinToString("") { "%02x".format(it) }

        return ThreatVerdict(
            threatLevel = threatLevel,
            compositeRisk = riskScore / 100f,
            identifiedScamType = scamType,
            liveCoachingDirectives = directives,
            auditHash = auditHash,
            blockIndex = _auditHistory.value.size + 1,
            timestamp = timeStr,
            maskedTranscript = text,
            trustScore = 100 - riskScore,
            riskScore = riskScore,
            explanation = explanation
        )
    }

    private data class Tuple5<A, B, C, D, E>(val a: A, val b: B, val c: C, val d: D, val e: E)

    fun sendAudioChunk(audioBase64: String, isFinal: Boolean = false, hasScreenShare: Boolean = false) {
        val payload = mapOf(
            "type" to "AUDIO_CHUNK",
            "audioBase64" to audioBase64,
            "isFinal" to isFinal,
            "screen_share_active" to hasScreenShare
        )
        val json = gson.toJson(payload)
        webSocket?.send(json)
    }

    fun recordProof(verdict: ThreatVerdict) {
        val currentList = _auditHistory.value.toMutableList()
        currentList.add(0, verdict)
        _auditHistory.value = currentList
    }

    fun injectLocalVerdict(verdict: ThreatVerdict) {
        _latestVerdict.value = verdict
        recordProof(verdict)
    }

    fun disconnect() {
        webSocket?.close(1000, "User disconnected")
        webSocket = null
        _connectionState.value = ConnectionStatus.DISCONNECTED
    }

    fun clearAuditHistory() {
        _auditHistory.value = emptyList()
    }
}
