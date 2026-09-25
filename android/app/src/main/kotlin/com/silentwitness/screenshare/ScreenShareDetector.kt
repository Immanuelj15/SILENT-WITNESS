package com.silentwitness.screenshare

import android.content.Context
import android.util.Log

/**
 * Section 9 & 21: Android Screen-Sharing Coercion Detector.
 * Identifies dangerous screen-share prompts received during messaging calls.
 */
class ScreenShareDetector(private val context: Context) {

    companion object {
        private const val TAG = "ScreenShareDetector"
        private val DANGEROUS_TRIGGERS = listOf(
            "share screen",
            "share your screen",
            "start sharing",
            "open banking app",
            "open your bank",
            "show otp",
            "show your sms",
            "anydesk",
            "quicksupport",
            "teamviewer",
            "rustdesk",
            "download apk"
        )
    }

    data class DetectionResult(
        val isCoercionDetected: Boolean,
        val riskLevel: String,
        val detectedTriggers: List<String>,
        val warningMessage: String?
    )

    fun evaluateTextSnippet(snippet: String): DetectionResult {
        val lower = snippet.lowercase()
        val matched = DANGEROUS_TRIGGERS.filter { lower.contains(it) }

        if (matched.isNotEmpty()) {
            Log.w(TAG, "Screen-sharing risk detected: $matched")
            return DetectionResult(
                isCoercionDetected = true,
                riskLevel = "CRITICAL",
                detectedTriggers = matched,
                warningMessage = "🚨 STOP: The caller is asking you to share your screen or install remote software. Do NOT share your screen."
            )
        }

        return DetectionResult(
            isCoercionDetected = false,
            riskLevel = "SAFE",
            detectedTriggers = emptyList(),
            warningMessage = null
        )
    }
}
