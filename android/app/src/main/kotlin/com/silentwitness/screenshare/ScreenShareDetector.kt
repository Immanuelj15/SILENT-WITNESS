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

        const val ACTION_SCREEN_SHARE_DETECTED = "com.silentwitness.action.SCREEN_SHARE_DETECTED"
        const val EXTRA_DETECTION_REASON = "extra_detection_reason"

        val SUSPICIOUS_PACKAGES = mapOf(
            "com.anydesk.anydeskandroid" to "AnyDesk Remote Control",
            "com.teamviewer.host.market" to "TeamViewer Host",
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
        val warningMessage: String?,
        val isScreenCaptureActive: Boolean = false
    )

    fun isScreenCaptureActive(): Boolean {
        return try {
            val displayManager = context.getSystemService(Context.DISPLAY_SERVICE) as? android.hardware.display.DisplayManager
            val displays = displayManager?.displays ?: return false
            // Check for presentation or virtual displays created by screen recording/mirroring
            displays.any { display ->
                display.displayId != android.view.Display.DEFAULT_DISPLAY
            }
        } catch (e: Exception) {
            Log.w(TAG, "Notice checking display capture state: ${e.message}")
            false
        }
    }

    fun broadcastScreenShareAlert(reason: String) {
        try {
            val intent = android.content.Intent(ACTION_SCREEN_SHARE_DETECTED).apply {
                putExtra(EXTRA_DETECTION_REASON, reason)
                setPackage(context.packageName)
            }
            context.sendBroadcast(intent)
            Log.w(TAG, "Dispatched ACTION_SCREEN_SHARE_DETECTED broadcast: $reason")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to broadcast screen share alert: ${e.message}")
        }
    }

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

    fun checkActiveRemotePackages(): List<String> {
        val am = context.getSystemService(Context.ACTIVITY_SERVICE) as? android.app.ActivityManager
        val runningTools = mutableListOf<String>()
        val processes = am?.runningAppProcesses ?: return emptyList()

        for (proc in processes) {
            for (pkg in proc.pkgList) {
                if (SUSPICIOUS_PACKAGES.containsKey(pkg)) {
                    runningTools.add(SUSPICIOUS_PACKAGES[pkg] ?: pkg)
                }
            }
        }
        return runningTools
    }

    fun checkAndBroadcastScreenShareThreat(): Boolean {
        val screenCaptureActive = isScreenCaptureActive()
        val activeTools = checkActiveRemotePackages()

        if (screenCaptureActive || activeTools.isNotEmpty()) {
            val reason = if (screenCaptureActive) {
                "CRITICAL WARNING: SCREEN SHARING ACTIVE - SCAMMER CAN VIEW YOUR BANK DETAILS & PASSWORDS"
            } else {
                "CRITICAL WARNING: ACTIVE REMOTE DESKTOP APP DETECTED (${activeTools.joinToString()}) - CLOSE IMMEDIATELY"
            }
            broadcastScreenShareAlert(reason)
            return true
        }
        return false
    }

    fun evaluateContext(snippet: String): DetectionResult {
        val lower = snippet.lowercase()
        val matchedTriggers = DANGEROUS_TRIGGERS.filter { lower.contains(it) }
        val installedTools = checkInstalledRemoteTools()
        val activeTools = checkActiveRemotePackages()
        val screenCaptureActive = isScreenCaptureActive()

        val isThreat = screenCaptureActive || activeTools.isNotEmpty() || matchedTriggers.isNotEmpty() || (installedTools.isNotEmpty() && (lower.contains("open") || lower.contains("download")))

        if (isThreat) {
            val warning = when {
                screenCaptureActive ->
                    "CRITICAL WARNING: SCREEN SHARING ACTIVE - SCAMMER CAN VIEW YOUR BANK DETAILS & PASSWORDS"
                activeTools.isNotEmpty() ->
                    "CRITICAL WARNING: ACTIVE REMOTE APP (${activeTools.joinToString()}) - SCAMMER CAN VIEW PASSWORDS"
                matchedTriggers.contains("anydesk") || matchedTriggers.contains("teamviewer") ->
                    "CRITICAL: Caller requested Remote Desktop software. NEVER install or launch AnyDesk/TeamViewer!"
                matchedTriggers.contains("share screen") || matchedTriggers.contains("start sharing") ->
                    "CRITICAL: Screen-sharing requested! Scammers will see your OTPs and banking passwords. Do NOT share your screen."
                installedTools.isNotEmpty() ->
                    "HIGH RISK: Remote access tools detected (${installedTools.joinToString()}). Do NOT open them on this call."
                else ->
                    "SUSPECTED SCREEN SHARING COERCION DETECTED."
            }

            broadcastScreenShareAlert(warning)

            return DetectionResult(
                isCoercionDetected = true,
                riskLevel = "CRITICAL",
                detectedTriggers = matchedTriggers,
                installedThreatPackages = installedTools,
                warningMessage = warning,
                isScreenCaptureActive = screenCaptureActive
            )
        }

        return DetectionResult(
            isCoercionDetected = false,
            riskLevel = "SAFE",
            detectedTriggers = emptyList(),
            installedThreatPackages = installedTools,
            warningMessage = null,
            isScreenCaptureActive = false
        )
    }
}
