package com.silentwitness.accessibility

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.silentwitness.audio.AudioRecordingService
import com.silentwitness.network.WebSocketClientManager
import com.silentwitness.overlay.GuardianOverlayService

/**
 * Real-Time Accessibility Service for OTT / VoIP Call Interception.
 * Inspects UI changes across WhatsApp and Telegram to automatically trigger the
 * Guardian Floating Overlay and Audio Safety Layer whenever a video or voice call starts.
 */
class CallAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "CallAccessibility"
        var instance: CallAccessibilityService? = null
            private set

        private val CALL_KEYWORDS = listOf(
            "whatsapp call", "incoming call", "video call", "voice call",
            "calling", "ringing", "ongoing call", "call in progress",
            "swipe up to accept", "turn off your video", "turn on your video",
            "mute microphone", "speaker", "switch camera",
            "telegram call", "end call"
        )
    }

    private var isOttCallActive = false
    private var lastCallerName: String = "WhatsApp / Telegram Contact"

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "CallAccessibilityService connected and standing guard over OTT telephony")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val pkg = event.packageName?.toString() ?: return

        if (pkg.contains("whatsapp") || pkg.contains("telegram")) {
            inspectWindowForActiveCall(rootInActiveWindow, pkg)
        }
    }

    private fun inspectWindowForActiveCall(rootNode: AccessibilityNodeInfo?, pkg: String) {
        if (rootNode == null) return

        val textElements = mutableListOf<String>()
        collectTextNodes(rootNode, textElements)

        val fullText = textElements.joinToString(" ").lowercase()
        val hasCallKeyword = CALL_KEYWORDS.any { fullText.contains(it) }

        if (hasCallKeyword) {
            val isEnding = fullText.contains("call ended") || fullText.contains("call declined")

            if (isEnding && isOttCallActive) {
                Log.i(TAG, "OTT Call ended in $pkg. Hiding overlay.")
                isOttCallActive = false
                GuardianOverlayService.stopService(applicationContext)
                AudioRecordingService.stopService(applicationContext)
                return
            }

            if (!isOttCallActive && !isEnding) {
                isOttCallActive = true
                val channelLabel = if (pkg.contains("whatsapp")) "WhatsApp Call" else "Telegram Call"
                Log.i(TAG, "Active OTT call detected in $pkg ($channelLabel)! Launching Guardian HUD & Audio engine.")

                // Extract contact name if possible
                val suspectedName = textElements.firstOrNull { it.length in 3..25 && !CALL_KEYWORDS.any { kw -> it.lowercase().contains(kw) } }
                if (suspectedName != null) {
                    lastCallerName = suspectedName
                }

                // 1. Ensure WebSocket connection is live
                WebSocketClientManager.instance.connect()

                // 2. Start Guardian Floating Overlay Service passing caller metadata
                GuardianOverlayService.startService(
                    context = applicationContext,
                    callerNumber = lastCallerName,
                    callType = channelLabel
                )

                // 3. Start Foreground Audio Recording Service for real-time scam/OTP analysis
                AudioRecordingService.startService(applicationContext)
            }
        }
    }

    private fun collectTextNodes(node: AccessibilityNodeInfo?, output: MutableList<String>) {
        if (node == null) return

        val text = node.text?.toString()
        if (!text.isNullOrBlank()) {
            output.add(text)
        }

        val desc = node.contentDescription?.toString()
        if (!desc.isNullOrBlank()) {
            output.add(desc)
        }

        for (i in 0 until node.childCount) {
            collectTextNodes(node.getChild(i), output)
        }
    }

    /**
     * Programmatic OTT call termination via accessibility node action click or global back action.
     */
    fun terminateOttCall(): Boolean {
        val root = rootInActiveWindow
        if (root != null) {
            val endCallNodes = mutableListOf<AccessibilityNodeInfo>()
            findEndCallButtons(root, endCallNodes)

            for (btn in endCallNodes) {
                if (btn.isClickable) {
                    val success = btn.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    if (success) {
                        Log.i(TAG, "Successfully clicked End Call button via Accessibility.")
                        isOttCallActive = false
                        GuardianOverlayService.stopService(applicationContext)
                        AudioRecordingService.stopService(applicationContext)
                        return true
                    }
                }
            }
        }

        // Fallback: Global Back Action to dismiss/decline OTT call activity
        val backSuccess = performGlobalAction(GLOBAL_ACTION_BACK)
        if (backSuccess) {
            Log.i(TAG, "Dismissed OTT call screen via GLOBAL_ACTION_BACK.")
            isOttCallActive = false
            GuardianOverlayService.stopService(applicationContext)
            AudioRecordingService.stopService(applicationContext)
            return true
        }
        return false
    }

    private fun findEndCallButtons(node: AccessibilityNodeInfo?, output: MutableList<AccessibilityNodeInfo>) {
        if (node == null) return

        val text = (node.text?.toString() ?: "").lowercase()
        val desc = (node.contentDescription?.toString() ?: "").lowercase()

        if (text.contains("end call") || desc.contains("end call") || desc.contains("decline") || text.contains("decline")) {
            output.add(node)
        }

        for (i in 0 until node.childCount) {
            findEndCallButtons(node.getChild(i), output)
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "CallAccessibilityService interrupted")
    }

    override fun onDestroy() {
        instance = null
        isOttCallActive = false
        super.onDestroy()
    }
}
