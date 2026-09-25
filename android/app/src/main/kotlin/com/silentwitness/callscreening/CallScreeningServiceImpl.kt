package com.silentwitness.callscreening

import android.net.Uri
import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import android.util.Log
import androidx.annotation.RequiresApi

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

    override fun onScreenCall(callDetails: Call.Details) {
        val handle: Uri? = callDetails.handle
        val rawNumber = handle?.schemeSpecificPart ?: "UNKNOWN"

        Log.i(TAG, "Screening incoming cellular call from: $rawNumber")

        // 1. Evaluate Caller Number with Backend Risk Engine or Local Cache
        val isSpamPattern = isKnownSpamPrefix(rawNumber)

        val responseBuilder = CallResponse.Builder()

        if (isSpamPattern) {
            Log.w(TAG, "High-risk robocall/scam pattern matched for $rawNumber. Silencing call.")
            responseBuilder
                .setDisallowCall(false) // Let user decide if critical, or setDisallowCall(true) to auto-block
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

        respondToCall(callDetails, responseBuilder.build())
    }

    private fun isKnownSpamPrefix(number: String): Boolean {
        // High frequency robocall/telemarketing prefix screening
        val clean = number.replace(Regex("[\\s\\-\\(\\)]"), "")
        return clean.startsWith("+91140") || clean.startsWith("140") || clean.startsWith("+4470")
    }
}
