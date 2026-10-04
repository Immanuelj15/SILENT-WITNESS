package com.silentwitness.ui

import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.silentwitness.data.ThreatVerdict
import com.silentwitness.network.ConnectionStatus
import com.silentwitness.network.WebSocketClientManager
import com.silentwitness.overlay.GuardianOverlayService
import com.silentwitness.screenshare.ScreenShareDetector
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class GuardianViewModel : ViewModel() {

    private val wsManager = WebSocketClientManager.instance

    private val _isShieldArmed = MutableStateFlow(true)
    val isShieldArmed: StateFlow<Boolean> = _isShieldArmed.asStateFlow()

    private val _hasOverlayPermission = MutableStateFlow(false)
    val hasOverlayPermission: StateFlow<Boolean> = _hasOverlayPermission.asStateFlow()

    private val _hasCallScreeningRole = MutableStateFlow(false)
    val hasCallScreeningRole: StateFlow<Boolean> = _hasCallScreeningRole.asStateFlow()

    private val _hasAccessibilityPermission = MutableStateFlow(false)
    val hasAccessibilityPermission: StateFlow<Boolean> = _hasAccessibilityPermission.asStateFlow()

    private val _installedRemoteTools = MutableStateFlow<List<String>>(emptyList())
    val installedRemoteTools: StateFlow<List<String>> = _installedRemoteTools.asStateFlow()

    val connectionState: StateFlow<ConnectionStatus> = wsManager.connectionState
    val latestVerdict: StateFlow<ThreatVerdict?> = wsManager.latestVerdict
    val auditHistory: StateFlow<List<ThreatVerdict>> = wsManager.auditHistory

    fun checkPermissions(context: Context) {
        _hasOverlayPermission.value = Settings.canDrawOverlays(context)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = context.getSystemService(RoleManager::class.java)
            _hasCallScreeningRole.value = roleManager?.isRoleHeld(RoleManager.ROLE_CALL_SCREENING) == true
        } else {
            _hasCallScreeningRole.value = true
        }

        _hasAccessibilityPermission.value = isAccessibilityServiceEnabled(context)

        val detector = ScreenShareDetector(context)
        _installedRemoteTools.value = detector.checkInstalledRemoteTools()
    }

    fun requestAccessibilityPermission(context: Context) {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }

    private fun isAccessibilityServiceEnabled(context: Context): Boolean {
        return try {
            val expectedComponent = android.content.ComponentName(context, com.silentwitness.accessibility.CallAccessibilityService::class.java).flattenToString()
            val enabledServices = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return false
            val colonSplitter = android.text.TextUtils.SimpleStringSplitter(':')
            colonSplitter.setString(enabledServices)
            while (colonSplitter.hasNext()) {
                val component = colonSplitter.next()
                if (component.equals(expectedComponent, ignoreCase = true) ||
                    component.contains(context.packageName, ignoreCase = true)
                ) {
                    return true
                }
            }
            false
        } catch (e: Exception) {
            false
        }
    }

    fun toggleShield(context: Context) {
        val newState = !_isShieldArmed.value
        _isShieldArmed.value = newState

        if (newState) {
            GuardianOverlayService.startService(context)
            wsManager.connect()
        } else {
            GuardianOverlayService.stopService(context)
            wsManager.disconnect()
        }
    }

    fun requestOverlayPermission(context: Context) {
        if (!Settings.canDrawOverlays(context)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${context.packageName}")
            ).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        }
    }

    fun requestCallScreeningRole(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = context.getSystemService(RoleManager::class.java)
            if (roleManager?.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING) == true) {
                val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
            }
        }
    }

    fun sendScamLabSnippet(text: String, context: Context? = null) {
        viewModelScope.launch {
            if (wsManager.connectionState.value != ConnectionStatus.CONNECTED) {
                wsManager.connect()
            }
            wsManager.sendSpeechSnippet(text, isFinal = false)
        }
    }

    fun injectScamLabScenario(scenarioIndex: Int, context: Context) {
        viewModelScope.launch {
            val (scenarioName, script, threatLevel, riskScore, scamType, directives, bannerType) = when (scenarioIndex) {
                0 -> Tuple7(
                    "Digital Arrest Coercion",
                    "This is Mumbai Police Cyber Crime Cell. A narcotics consignment was intercepted under your Aadhaar. You are under immediate digital arrest and cannot disconnect.",
                    "CRITICAL",
                    96,
                    "Digital Arrest / Law Enforcement Extortion",
                    listOf(
                        "DO NOT TRANSFER CLEARANCE FEES",
                        "POLICE NEVER ISSUE ARRESTS OVER VIDEO CALLS",
                        "Digital arrest is legally non-existent. Hang up immediately."
                    ),
                    "DIGITAL_ARREST"
                )
                1 -> Tuple7(
                    "Electricity Disconnection / Remote Screen Share",
                    "Your power will be cut tonight at 9:30 PM due to unpaid electricity bill. Download AnyDesk immediately and share the 9-digit OTP code to verify power meter.",
                    "CRITICAL",
                    94,
                    "Electricity Disconnection / Remote Screen Share",
                    listOf(
                        "NEVER DOWNLOAD ANYDESK OR TEAMVIEWER",
                        "DO NOT SHARE OTP OR SCREEN ACCESS",
                        "Utility boards do not demand remote desktop apps to pay bills."
                    ),
                    "REMOTE_ACCESS"
                )
                2 -> Tuple7(
                    "Customs Seizure Consignment",
                    "This is International Customs Clearance. Your consignment parcel was seized containing illegal contraband. Pay Rs. 50,000 penalty clearance fee immediately.",
                    "CRITICAL",
                    93,
                    "Customs Seizure Consignment Extortion",
                    listOf(
                        "DO NOT TRANSFER CLEARANCE FEES",
                        "Customs notices are NEVER served via phone calls",
                        "Report extortion attempt to National Cyber Helpline 1930"
                    ),
                    "REMOTE_ACCESS"
                )
                else -> Tuple7(
                    "Benign Routine Call",
                    "Hi, I am calling to confirm if the grocery delivery arrived safely at your apartment. Have a good afternoon.",
                    "SAFE",
                    5,
                    "Benign Routine Call",
                    listOf(
                        "Standard conversational baseline observed",
                        "Maintain regular personal credential awareness"
                    ),
                    "SAFE"
                )
            }

            // Cryptographic SHA-256 audit hash generation
            val auditHash = java.security.MessageDigest.getInstance("SHA-256")
                .digest("$scenarioName:$riskScore:${System.currentTimeMillis()}".toByteArray())
                .joinToString("") { "%02x".format(it) }

            val timeStr = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.US).format(java.util.Date())

            val verdict = ThreatVerdict(
                threatLevel = threatLevel,
                compositeRisk = riskScore / 100.0f,
                identifiedScamType = scamType,
                liveCoachingDirectives = directives,
                auditHash = auditHash,
                blockIndex = wsManager.auditHistory.value.size + 1,
                timestamp = timeStr,
                maskedTranscript = script,
                trustScore = 100 - riskScore,
                riskScore = riskScore,
                deepfakeConfidence = if (scenarioIndex == 0) 0.89f else 0.05f,
                screenShareRisk = (scenarioIndex == 1),
                explanation = "Scam Lab Sandbox: Injected simulated scenario for $scenarioName."
            )

            // 1. Immediately drive the live risk gauge and audit history
            wsManager.injectLocalVerdict(verdict)

            // 2. Also send over WebSocket if connected
            if (wsManager.connectionState.value == ConnectionStatus.CONNECTED) {
                wsManager.sendSpeechSnippet(script, isFinal = false)
            }

            // 3. Immediately drive floating overlay
            if (Settings.canDrawOverlays(context)) {
                if (threatLevel == "SAFE") {
                    GuardianOverlayService.stopService(context)
                } else {
                    simulateOverlay(context, bannerType)
                }
            }
        }
    }

    private data class Tuple7<A, B, C, D, E, F, G>(
        val a: A, val b: B, val c: C, val d: D, val e: E, val f: F, val g: G
    )

    fun simulateOverlay(context: Context, threatType: String) {
        val intent = Intent(context, GuardianOverlayService::class.java).apply {
            action = GuardianOverlayService.ACTION_SIMULATE_ALERT
            putExtra(GuardianOverlayService.EXTRA_THREAT_TYPE, threatType)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
    }

    fun clearAuditHistory() {
        wsManager.clearAuditHistory()
    }
}
