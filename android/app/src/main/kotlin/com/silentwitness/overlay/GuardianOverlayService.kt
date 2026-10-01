package com.silentwitness.overlay

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.media.AudioManager
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.telecom.TelecomManager
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat
import com.silentwitness.R
import com.silentwitness.SilentWitnessApp
import com.silentwitness.data.ThreatVerdict
import com.silentwitness.network.WebSocketClientManager
import com.silentwitness.ui.MainActivity
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.collectLatest

class GuardianOverlayService : Service() {

    companion object {
        private const val TAG = "GuardianOverlayService"
        const val ACTION_START = "com.silentwitness.action.START_OVERLAY"
        const val ACTION_STOP = "com.silentwitness.action.STOP_OVERLAY"
        const val ACTION_SIMULATE_ALERT = "com.silentwitness.action.SIMULATE_ALERT"
        const val EXTRA_THREAT_TYPE = "extra_threat_type"
        const val EXTRA_MESSAGE = "extra_message"
        private const val NOTIFICATION_ID = 9001

        fun startService(context: Context) {
            val intent = Intent(context, GuardianOverlayService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, GuardianOverlayService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var isOverlayVisible = false
    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var audioManager: AudioManager? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager

        startForegroundNotification("Guardian Active", "Monitoring ongoing communication for scam threats")
        observeThreatVerdicts()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                hideOverlay()
                stopForeground(true)
                stopSelf()
            }
            ACTION_SIMULATE_ALERT -> {
                val threatType = intent.getStringExtra(EXTRA_THREAT_TYPE) ?: "OTP"
                val customMsg = intent.getStringExtra(EXTRA_MESSAGE)
                simulateThreat(threatType, customMsg)
            }
            ACTION_START -> {
                Log.i(TAG, "Guardian Overlay Service running in foreground")
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

    private fun observeThreatVerdicts() {
        serviceScope.launch {
            WebSocketClientManager.instance.latestVerdict.collectLatest { verdict ->
                if (verdict != null) {
                    handleVerdict(verdict)
                }
            }
        }
    }

    private fun handleVerdict(verdict: ThreatVerdict) {
        when (verdict.threatLevel) {
            "CRITICAL" -> {
                if (verdict.identifiedScamType.contains("Digital Arrest", ignoreCase = true)) {
                    showOverlay(
                        isCritical = true,
                        bannerTitle = "🚨 SUSPECTED DIGITAL ARREST - POLICE NEVER USE WHATSAPP",
                        primaryDirective = verdict.liveCoachingDirectives.firstOrNull()
                            ?: "Do NOT transfer funds. Police and CBI never arrest citizens over video calls.",
                        riskScore = verdict.riskScore
                    )
                } else {
                    showOverlay(
                        isCritical = true,
                        bannerTitle = "🚨 CRITICAL: DO NOT SHARE OTP OR SCREEN",
                        primaryDirective = verdict.liveCoachingDirectives.firstOrNull()
                            ?: "Demanding OTP or Remote Access detected. Never disclose banking credentials.",
                        riskScore = verdict.riskScore
                    )
                }
            }
            "HIGH" -> {
                showOverlay(
                    isCritical = false,
                    bannerTitle = "⚠️ CAUTION: SUSPICIOUS SENSITIVE DEMAND DETECTED",
                    primaryDirective = verdict.liveCoachingDirectives.firstOrNull()
                        ?: "Verify caller identity out-of-band before proceeding.",
                    riskScore = verdict.riskScore
                )
            }
            "SAFE" -> {
                // If previously flagged, hide or transition to safe
                hideOverlay()
            }
        }
    }

    private fun simulateThreat(threatType: String, customMessage: String?) {
        when (threatType.uppercase()) {
            "DIGITAL_ARREST" -> {
                showOverlay(
                    isCritical = true,
                    bannerTitle = "🚨 SUSPECTED DIGITAL ARREST - POLICE NEVER USE WHATSAPP",
                    primaryDirective = customMessage ?: "Narcotics/customs extortion detected. Police never interrogate via WhatsApp. Hang up immediately.",
                    riskScore = 95
                )
            }
            "REMOTE_ACCESS" -> {
                showOverlay(
                    isCritical = true,
                    bannerTitle = "🚨 CRITICAL: REMOTE ACCESS TAKEOVER ATTEMPT",
                    primaryDirective = customMessage ?: "Do NOT install AnyDesk, TeamViewer, or share your screen. Terminate call immediately.",
                    riskScore = 94
                )
            }
            else -> {
                showOverlay(
                    isCritical = true,
                    bannerTitle = "🚨 CRITICAL: DO NOT SHARE OTP",
                    primaryDirective = customMessage ?: "Bank impersonation detected. Never read out OTP or passwords over phone calls.",
                    riskScore = 88
                )
            }
        }
    }

    private fun showOverlay(
        isCritical: Boolean,
        bannerTitle: String,
        primaryDirective: String,
        riskScore: Int
    ) {
        if (!Settings.canDrawOverlays(this)) {
            Log.w(TAG, "Cannot show overlay: SYSTEM_ALERT_WINDOW permission missing")
            return
        }

        serviceScope.launch(Dispatchers.Main) {
            if (isOverlayVisible && overlayView != null) {
                updateOverlayContent(isCritical, bannerTitle, primaryDirective, riskScore)
                return@launch
            }

            val layoutParams = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                else
                    @Suppress("DEPRECATION")
                    WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
                y = 60
            }

            val rootLayout = buildOverlayView(isCritical, bannerTitle, primaryDirective, riskScore)
            overlayView = rootLayout

            try {
                windowManager?.addView(rootLayout, layoutParams)
                isOverlayVisible = true
                Log.i(TAG, "Guardian Overlay displayed successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to add window overlay: ${e.message}")
            }
        }
    }

    private fun updateOverlayContent(isCritical: Boolean, title: String, directive: String, riskScore: Int) {
        val root = overlayView as? LinearLayout ?: return
        val titleView = root.findViewById<TextView>(R.id.overlay_title)
        val msgView = root.findViewById<TextView>(R.id.overlay_message)

        titleView?.text = title
        msgView?.text = directive

        val bgDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 32f
            setColor(if (isCritical) Color.parseColor("#991B1B") else Color.parseColor("#B45309"))
            setStroke(4, Color.parseColor("#FFFFFF"))
        }
        root.background = bgDrawable
    }

    private fun buildOverlayView(
        isCritical: Boolean,
        title: String,
        directive: String,
        riskScore: Int
    ): View {
        val density = resources.displayMetrics.density
        fun dp(value: Int): Int = (value * density).toInt()

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(18), dp(20), dp(18))

            val bg = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = dp(16).toFloat()
                setColor(if (isCritical) Color.parseColor("#991B1B") else Color.parseColor("#B45309"))
                setStroke(dp(2), Color.parseColor("#FFFFFF"))
            }
            background = bg
            elevation = dp(12).toFloat()
        }

        // Header Title
        val titleView = TextView(this).apply {
            id = R.id.overlay_title
            text = title
            setTextColor(Color.WHITE)
            textSize = 15f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(0, 0, 0, dp(6))
        }
        root.addView(titleView)

        // Directive Subtitle
        val directiveView = TextView(this).apply {
            id = R.id.overlay_message
            text = directive
            setTextColor(Color.parseColor("#FEF2F2"))
            textSize = 13f
            typeface = Typeface.DEFAULT
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(0, 0, 0, dp(14))
        }
        root.addView(directiveView)

        // Fast Action Buttons Row
        val actionsRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            weightSum = 3f
        }

        // 1. MUTE CALLER Button
        val muteButton = Button(this).apply {
            text = "MUTE CALL"
            textSize = 12f
            setTextColor(Color.WHITE)
            typeface = Typeface.DEFAULT_BOLD
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#1E293B"))
                cornerRadius = dp(8).toFloat()
                setStroke(dp(1), Color.WHITE)
            }
            layoutParams = LinearLayout.LayoutParams(0, dp(42), 1f).apply {
                marginEnd = dp(6)
            }
            setOnClickListener {
                toggleMute()
            }
        }
        actionsRow.addView(muteButton)

        // 2. DISCONNECT Button
        val disconnectButton = Button(this).apply {
            text = "DISCONNECT"
            textSize = 12f
            setTextColor(Color.WHITE)
            typeface = Typeface.DEFAULT_BOLD
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#DC2626"))
                cornerRadius = dp(8).toFloat()
                setStroke(dp(1), Color.WHITE)
            }
            layoutParams = LinearLayout.LayoutParams(0, dp(42), 1f).apply {
                marginEnd = dp(6)
            }
            setOnClickListener {
                disconnectActiveCall()
            }
        }
        actionsRow.addView(disconnectButton)

        // 3. DISMISS Button
        val dismissButton = Button(this).apply {
            text = "DISMISS"
            textSize = 12f
            setTextColor(Color.parseColor("#E2E8F0"))
            typeface = Typeface.DEFAULT
            background = GradientDrawable().apply {
                setColor(Color.TRANSPARENT)
                cornerRadius = dp(8).toFloat()
            }
            layoutParams = LinearLayout.LayoutParams(0, dp(42), 1f)
            setOnClickListener {
                hideOverlay()
            }
        }
        actionsRow.addView(dismissButton)

        root.addView(actionsRow)
        return root
    }

    private fun toggleMute() {
        try {
            audioManager?.let { am ->
                val newMute = !am.isMicrophoneMute
                am.isMicrophoneMute = newMute
                Log.i(TAG, "Microphone mute toggled to: $newMute")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to mute: ${e.message}")
        }
    }

    private fun disconnectActiveCall() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val telecomManager = getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
                @Suppress("MissingPermission")
                telecomManager?.endCall()
                Log.i(TAG, "Telecom endCall requested")
            }
        } catch (e: Exception) {
            Log.w(TAG, "End call via TelecomManager notice: ${e.message}")
        }
        hideOverlay()
    }

    private fun hideOverlay() {
        serviceScope.launch(Dispatchers.Main) {
            if (isOverlayVisible && overlayView != null) {
                try {
                    windowManager?.removeView(overlayView)
                    Log.i(TAG, "Guardian Overlay hidden")
                } catch (e: Exception) {
                    Log.w(TAG, "Error removing overlay view: ${e.message}")
                }
                overlayView = null
                isOverlayVisible = false
            }
        }
    }

    override fun onDestroy() {
        hideOverlay()
        serviceScope.cancel()
        super.onDestroy()
    }
}
