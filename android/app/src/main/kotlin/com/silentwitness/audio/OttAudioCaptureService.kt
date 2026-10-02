package com.silentwitness.audio

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.silentwitness.R
import com.silentwitness.SilentWitnessApp
import com.silentwitness.network.WebSocketClientManager
import com.silentwitness.overlay.GuardianOverlayService
import com.silentwitness.ui.MainActivity

/**
 * Foreground Service for OTT Audio/Video Stream Interception (WhatsApp & Telegram).
 * Coordinates low-latency audio capture and streams 16kHz PCM chunks to the backend
 * real-time scam interception pipeline.
 */
class OttAudioCaptureService : Service() {

    companion object {
        private const val TAG = "OttAudioCaptureService"
        private const val NOTIFICATION_ID = 9002

        const val ACTION_START_OTT_CAPTURE = "com.silentwitness.action.START_OTT_CAPTURE"
        const val ACTION_STOP_OTT_CAPTURE = "com.silentwitness.action.STOP_OTT_CAPTURE"

        fun start(context: Context) {
            val intent = Intent(context, OttAudioCaptureService::class.java).apply {
                action = ACTION_START_OTT_CAPTURE
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, OttAudioCaptureService::class.java).apply {
                action = ACTION_STOP_OTT_CAPTURE
            }
            context.startService(intent)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        startForegroundNotification("OTT Protection Active", "Monitoring WhatsApp/Telegram call audio stream")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_OTT_CAPTURE -> {
                Log.i(TAG, "Starting OTT Audio/Video Stream Capture")
                WebSocketClientManager.instance.connect()
                GuardianOverlayService.startService(this)
                CallAudioStreamer.startStreaming(this)
            }
            ACTION_STOP_OTT_CAPTURE -> {
                Log.i(TAG, "Stopping OTT Audio/Video Stream Capture")
                CallAudioStreamer.stopStreaming()
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                } else {
                    @Suppress("DEPRECATION")
                    stopForeground(true)
                }
                stopSelf()
            }
        }
        return START_STICKY
    }

    private fun startForegroundNotification(title: String, content: String) {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification: Notification = NotificationCompat.Builder(this, SilentWitnessApp.OVERLAY_CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(R.drawable.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        startForeground(NOTIFICATION_ID, notification)
    }

    override fun onDestroy() {
        CallAudioStreamer.stopStreaming()
        super.onDestroy()
    }
}
