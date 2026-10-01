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
    private val host: String = "10.0.2.2", // Default for Android Emulator to host loopback
    private val port: Int = 8000
) {
    companion object {
        private const val TAG = "WebSocketClientMgr"
        val instance by lazy { WebSocketClientManager() }
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

    fun connect(customHost: String? = null, customPort: Int? = null) {
        if (_connectionState.value == ConnectionStatus.CONNECTED) return

        val targetHost = customHost ?: host
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
            }
        })
    }

    fun sendSpeechSnippet(text: String, isFinal: Boolean = false, callerMetadata: Map<String, Any> = emptyMap()) {
        val payload = mapOf(
            "type" to "TEXT_CHUNK",
            "text" to text,
            "isFinal" to isFinal,
            "callerMetadata" to callerMetadata
        )
        val json = gson.toJson(payload)
        webSocket?.send(json)
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
