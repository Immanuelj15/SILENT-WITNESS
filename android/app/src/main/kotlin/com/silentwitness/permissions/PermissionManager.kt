package com.silentwitness.permissions

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat

data class PermissionItem(
    val permission: String,
    val title: String,
    val rationale: String,
    val isGranted: Boolean,
    val isMandatory: Boolean
)

/**
 * Section 30: Transparent Permission Manager.
 * Never silently requests permissions; explains every rationale clearly.
 */
class PermissionManager(private val context: Context) {

    fun getPermissionStatusList(): List<PermissionItem> {
        val list = mutableListOf<PermissionItem>()

        // 1. Notifications
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            list.add(
                PermissionItem(
                    permission = Manifest.permission.POST_NOTIFICATIONS,
                    title = "Safety Notifications",
                    rationale = "Required to alert you immediately if scam coercion or screen-sharing risks occur during a call.",
                    isGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED,
                    isMandatory = true
                )
            )
        }

        // 2. Phone State / Call Screening
        list.add(
            PermissionItem(
                permission = Manifest.permission.READ_PHONE_STATE,
                title = "Call Screening & Detection",
                rationale = "Allows Silent Witness to detect incoming SIM calls and apply pre-call spam reputation checks.",
                isGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED,
                isMandatory = true
            )
        )

        // 3. Microphone (Optional for Own-VoIP / Manual Speech Analysis)
        list.add(
            PermissionItem(
                permission = Manifest.permission.RECORD_AUDIO,
                title = "Microphone (Optional)",
                rationale = "Used only for user-initiated Own-VoIP secure calls or live speech testing.",
                isGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED,
                isMandatory = false
            )
        )

        return list
    }
}
