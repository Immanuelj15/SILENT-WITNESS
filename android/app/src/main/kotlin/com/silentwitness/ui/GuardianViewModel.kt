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

        val detector = ScreenShareDetector(context)
        _installedRemoteTools.value = detector.checkInstalledRemoteTools()
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

    fun sendScamLabSnippet(text: String) {
        viewModelScope.launch {
            if (wsManager.connectionState.value != ConnectionStatus.CONNECTED) {
                wsManager.connect()
            }
            wsManager.sendSpeechSnippet(text, isFinal = false)
        }
    }

    fun simulateOverlay(context: Context, threatType: String) {
        val intent = Intent(context, GuardianOverlayService::class.java).apply {
            action = GuardianOverlayService.ACTION_SIMULATE_ALERT
            putExtra(GuardianOverlayService.EXTRA_THREAT_TYPE, threatType)
        }
        context.startService(intent)
    }

    fun clearAuditHistory() {
        wsManager.clearAuditHistory()
    }
}
