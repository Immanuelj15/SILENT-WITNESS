package com.silentwitness.callscreening

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.telephony.TelephonyManager
import android.util.Log
import com.silentwitness.network.WebSocketClientManager
import com.silentwitness.overlay.GuardianOverlayService

/**
 * Native Telephony Phone State Receiver.
 * Automatically binds and launches GuardianOverlayService HUD whenever a phone call
 * rings or transitions off-hook (answered), ensuring floating protection without manual user trigger.
 */
class PhoneCallReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "PhoneCallReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) return

        val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
        val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER) ?: "Unknown"

        Log.i(TAG, "Telephony state changed: $state (Caller: $incomingNumber)")

        when (state) {
            TelephonyManager.EXTRA_STATE_RINGING,
            TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                Log.i(TAG, "Active call detected ($state). Arming Guardian Overlay and WebSocket.")
                // 1. Ensure WebSocket connection is active
                WebSocketClientManager.instance.connect()

                // 2. Launch Guardian Overlay Service
                if (Settings.canDrawOverlays(context)) {
                    GuardianOverlayService.startService(context)
                } else {
                    Log.w(TAG, "Cannot launch overlay: SYSTEM_ALERT_WINDOW permission pending.")
                }
            }

            TelephonyManager.EXTRA_STATE_IDLE -> {
                Log.i(TAG, "Call ended (IDLE). Resetting Guardian Overlay.")
                GuardianOverlayService.stopService(context)
            }
        }
    }
}
