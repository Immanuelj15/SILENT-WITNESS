package com.silentwitness

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build

class SilentWitnessApp : Application() {

    companion object {
        const val OVERLAY_CHANNEL_ID = "guardian_overlay_channel"
        const val THREAT_ALERT_CHANNEL_ID = "threat_alert_channel"
        lateinit var instance: SilentWitnessApp
            private set
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)

            // Overlay Foreground Service Channel
            val overlayChannel = NotificationChannel(
                OVERLAY_CHANNEL_ID,
                "Guardian Call Shield Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows status of real-time call protection overlay"
            }

            // High Priority Threat Alert Channel
            val alertChannel = NotificationChannel(
                THREAT_ALERT_CHANNEL_ID,
                "Critical Scam Interception Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Critical alerts when scam or coercion is detected during phone calls"
                enableVibration(true)
            }

            notificationManager.createNotificationChannel(overlayChannel)
            notificationManager.createNotificationChannel(alertChannel)
        }
    }
}
