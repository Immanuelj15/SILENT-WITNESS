package com.silentwitness.screenshare

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log

/**
 * Screen-Sharing & Remote Access Coercion Detector.
 * Identifies dangerous screen-sharing prompts and inspects whether remote-control
 * packages (AnyDesk, TeamViewer, RustDesk) are installed or active on the device.
 */
class ScreenShareDetector(private val context: Context) {

    companion object {
        private const val TAG = "ScreenShareDetector"

        val SUSPICIOUS_PACKAGES = mapOf(
            "com.anydesk.anydeskandroid" to "AnyDesk Remote Control",
            "com.teamviewer.teamviewer.market.mobile" to "TeamViewer QuickSupport",
            "com.teamviewer.quicksupport.market" to "TeamViewer",
            "com.rustdesk.rustdesk" to "RustDesk Remote Desktop",
            "com.zoho.assist" to "Zoho Assist",
            "com.sand.airdroid" to "AirDroid Remote Support"
        )

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
        val installedThreatPackages: List<String>,
        val warningMessage: String?
    )

    fun checkInstalledRemoteTools(): List<String> {
        val pm = context.packageManager
        val foundTools = mutableListOf<String>()

        for ((pkg, label) in SUSPICIOUS_PACKAGES) {
            try {
                pm.getPackageInfo(pkg, 0)
                foundTools.add(label)
                Log.w(TAG, "High-risk remote tool detected on device: $label ($pkg)")
            } catch (e: PackageManager.NameNotFoundException) {
                // Not installed - safe
            }
        }
        return foundTools
    }

    fun evaluateContext(snippet: String): DetectionResult {
        val lower = snippet.lowercase()
        val matchedTriggers = DANGEROUS_TRIGGERS.filter { lower.contains(it) }
        val installedTools = checkInstalledRemoteTools()

        val isThreat = matchedTriggers.isNotEmpty() || (installedTools.isNotEmpty() && lower.contains("open"))

        if (isThreat) {
            val warning = when {
                matchedTriggers.contains("anydesk") || matchedTriggers.contains("teamviewer") ->
                    "CRITICAL: Caller requested Remote Desktop software. NEVER install or launch AnyDesk/TeamViewer!"
                matchedTriggers.contains("share screen") || matchedTriggers.contains("start sharing") ->
                    "CRITICAL: Screen-sharing requested! Scammers will see your OTPs and banking passwords. Do NOT share your screen."
                installedTools.isNotEmpty() ->
                    "HIGH RISK: Remote access tools detected (${installedTools.joinToString()}). Do NOT open them on this call."
                else ->
                    "SUSPECTED SCREEN SHARING COERCION DETECTED."
            }

            return DetectionResult(
                isCoercionDetected = true,
                riskLevel = "CRITICAL",
                detectedTriggers = matchedTriggers,
                installedThreatPackages = installedTools,
                warningMessage = warning
            )
        }

        return DetectionResult(
            isCoercionDetected = false,
            riskLevel = "SAFE",
            detectedTriggers = emptyList(),
            installedThreatPackages = installedTools,
            warningMessage = null
        )
    }
}
