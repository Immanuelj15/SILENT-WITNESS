package com.silentwitness.callscreening

import android.net.Uri
import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import android.util.Log
import androidx.annotation.RequiresApi
import com.silentwitness.network.WebSocketClientManager
import com.silentwitness.overlay.GuardianOverlayService
import com.silentwitness.audio.CallAudioStreamer
import kotlinx.coroutines.*
import java.util.concurrent.ConcurrentHashMap

/**
 * In-memory non-blocking caller reputation cache.
 */
object CallerReputationCache {
    data class ReputationEntry(val riskScore: Int, val isMalicious: Boolean, val category: String)

    private val cache = ConcurrentHashMap<String, ReputationEntry>().apply {
        put("+91140", ReputationEntry(92, true, "Known Robocall Extortion"))
        put("140", ReputationEntry(90, true, "Unsolicited Telemarketing"))
        put("+4470", ReputationEntry(95, true, "International Callback Fraud"))
        put("+92", ReputationEntry(88, true, "Foreign Unverified VoIP"))
    }

    fun lookup(number: String): ReputationEntry? {
        val clean = number.replace(Regex("[\\s\\-\\(\\)]"), "")
        for ((key, entry) in cache) {
            if (clean.startsWith(key) || clean == key) {
                return entry
            }
        }
        return null
    }

    fun record(number: String, riskScore: Int, category: String) {
        cache[number] = ReputationEntry(riskScore, riskScore >= 80, category)
    }
}

/**
 * Mode A: Android SIM Call Protection.
 * Uses official Android CallScreeningService to screen incoming cellular calls
 * against known scam databases and baseline risk tiers without violating OS audio privacy boundaries.
 */
@RequiresApi(Build.VERSION_CODES.Q)
class CallScreeningServiceImpl : CallScreeningService() {

    companion object {
        private const val TAG = "CallScreeningService"
    }

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onScreenCall(callDetails: Call.Details) {
        val handle: Uri? = callDetails.handle
        val rawNumber = handle?.schemeSpecificPart ?: "UNKNOWN"

        Log.i(TAG, "Screening incoming cellular call from: $rawNumber")

        // 1. Non-blocking reputation lookup against cache
        val cachedReputation = CallerReputationCache.lookup(rawNumber)
        val isSpam = cachedReputation?.isMalicious == true || isKnownSpamPrefix(rawNumber)
        val responseBuilder = CallResponse.Builder()

        if (isSpam) {
            Log.w(TAG, "High-risk robocall/scam pattern matched for $rawNumber: ${cachedReputation?.category ?: "Spam Prefix"}. Silencing call.")
            responseBuilder
                .setDisallowCall(false) // Let user decide if critical, or auto-block
                .setRejectCall(false)
                .setSilenceCall(true)
                .setSkipCallLog(false)
                .setSkipNotification(false)
        } else {
            Log.i(TAG, "Call allowed through standard zero-trust baseline.")
            responseBuilder
                .setDisallowCall(false)
                .setRejectCall(false)
                .setSilenceCall(false)
        }

        // 2. Non-blocking async background cache sync
        serviceScope.launch {
            try {
                if (cachedReputation == null && rawNumber != "UNKNOWN") {
                    // Update cache for subsequent turns
                    CallerReputationCache.record(rawNumber, if (isSpam) 90 else 5, if (isSpam) "Flagged" else "Verified")
                }
            } catch (e: Exception) {
                Log.w(TAG, "Notice on reputation background lookup: ${e.message}")
            }
        }

        // 3. Arm Guardian Protection Overlay for the active call
        try {
            GuardianOverlayService.startService(applicationContext)
            WebSocketClientManager.instance.connect()
            // 4. Pipe incoming audio stream frames through Voice Activity Detection (VAD)
            CallAudioStreamer.startStreaming(applicationContext)
        } catch (e: Exception) {
            Log.w(TAG, "Notice launching guardian services from screening service: ${e.message}")
        }

        respondToCall(callDetails, responseBuilder.build())
    }

    private fun isKnownSpamPrefix(number: String): Boolean {
        val clean = number.replace(Regex("[\\s\\-\\(\\)]"), "")
        return clean.startsWith("+91140") || clean.startsWith("140") || clean.startsWith("+4470")
    }

    override fun onDestroy() {
        serviceScope.cancel()
        super.onDestroy()
    }
}
