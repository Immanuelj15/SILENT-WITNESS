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

    private var lastObservedVerdict: ThreatVerdict? = null

    private val screenShareReceiver = object : android.content.BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == com.silentwitness.screenshare.ScreenShareDetector.ACTION_SCREEN_SHARE_DETECTED) {
                val reason = intent.getStringExtra(com.silentwitness.screenshare.ScreenShareDetector.EXTRA_DETECTION_REASON)
                    ?: "Unauthorized remote screen share active"
                Log.w(TAG, "Received high-priority screen share threat broadcast: $reason")
                showOverlay(
                    isCritical = true,
                    bannerTitle = "CRITICAL: DO NOT SHARE OTP / REMOTE ACCESS APP DETECTED",
                    primaryDirective = "Remote screen capture or remote control app active. Stop sharing immediately to protect credentials.",
                    riskScore = 98
                )
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager

        startForegroundNotification("Guardian Active", "Monitoring ongoing communication for scam threats")
        observeThreatVerdicts()

        // Register broadcast receiver for instant screen share threat notifications
        try {
            val filter = android.content.IntentFilter(com.silentwitness.screenshare.ScreenShareDetector.ACTION_SCREEN_SHARE_DETECTED)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(screenShareReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                registerReceiver(screenShareReceiver, filter)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Notice registering screenShareReceiver: ${e.message}")
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                hideOverlay()
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                } else {
                    @Suppress("DEPRECATION")
                    stopForeground(true)
                }
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
                    lastObservedVerdict = verdict
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
                        isCritical = false, // Amber banner
                        bannerTitle = "SUSPECTED DIGITAL ARREST - LAW ENFORCEMENT DOES NOT INVESTIGATE VIA MESSAGING APPS",
                        primaryDirective = verdict.liveCoachingDirectives.firstOrNull()
                            ?: "Do NOT transfer funds. Police and CBI never arrest citizens over video calls.",
                        riskScore = verdict.riskScore
                    )
                } else {
                    showOverlay(
                        isCritical = true, // Red banner
                        bannerTitle = "CRITICAL: DO NOT SHARE OTP / REMOTE ACCESS APP DETECTED",
                        primaryDirective = verdict.liveCoachingDirectives.firstOrNull()
                            ?: "Demanding OTP or Remote Access detected. Never disclose banking credentials.",
                        riskScore = verdict.riskScore
                    )
                }
            }
            "HIGH" -> {
                showOverlay(
                    isCritical = false, // Amber banner
                    bannerTitle = "SUSPECTED DIGITAL ARREST - LAW ENFORCEMENT DOES NOT INVESTIGATE VIA MESSAGING APPS",
                    primaryDirective = verdict.liveCoachingDirectives.firstOrNull()
                        ?: "Verify caller identity out-of-band before proceeding.",
                    riskScore = verdict.riskScore
                )
            }
            "SAFE" -> {
                hideOverlay()
            }
        }
    }

    private fun simulateThreat(threatType: String, customMessage: String?) {
        when (threatType.uppercase()) {
            "DIGITAL_ARREST" -> {
                showOverlay(
                    isCritical = false, // Amber banner
                    bannerTitle = "SUSPECTED DIGITAL ARREST - LAW ENFORCEMENT DOES NOT INVESTIGATE VIA MESSAGING APPS",
                    primaryDirective = customMessage ?: "Narcotics/customs extortion detected. Police never interrogate via WhatsApp. Hang up immediately.",
                    riskScore = 95
                )
            }
            "REMOTE_ACCESS" -> {
                showOverlay(
                    isCritical = true, // Red banner
                    bannerTitle = "CRITICAL: DO NOT SHARE OTP / REMOTE ACCESS APP DETECTED",
                    primaryDirective = customMessage ?: "Do NOT install AnyDesk, TeamViewer, or share your screen. Terminate call immediately.",
                    riskScore = 94
                )
            }
            else -> {
                showOverlay(
                    isCritical = true, // Red banner
                    bannerTitle = "CRITICAL: DO NOT SHARE OTP / REMOTE ACCESS APP DETECTED",
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
            setColor(if (isCritical) Color.parseColor("#EF4444") else Color.parseColor("#F59E0B"))
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
            setPadding(dp(18), dp(16), dp(18), dp(16))

            val bg = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = dp(16).toFloat()
                setColor(if (isCritical) Color.parseColor("#EF4444") else Color.parseColor("#F59E0B"))
                setStroke(dp(2), Color.parseColor("#FFFFFF"))
            }
            background = bg
            elevation = dp(12).toFloat()
        }

        // Header Title Row with Dismiss icon
        val headerRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            weightSum = 1f
        }

        val titleView = TextView(this).apply {
            id = R.id.overlay_title
            text = title
            setTextColor(Color.WHITE)
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.START
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 0.9f)
            setPadding(0, 0, dp(4), dp(4))
        }
        headerRow.addView(titleView)

        val closeBtn = TextView(this).apply {
            text = "✕"
            setTextColor(Color.WHITE)
            textSize = 16f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 0.1f)
            setOnClickListener { hideOverlay() }
        }
        headerRow.addView(closeBtn)

        root.addView(headerRow)

        // Directive Subtitle
        val directiveView = TextView(this).apply {
            id = R.id.overlay_message
            text = directive
            setTextColor(Color.parseColor("#FEF2F2"))
            textSize = 12f
            typeface = Typeface.DEFAULT
            gravity = Gravity.START
            setPadding(0, dp(4), 0, dp(12))
        }
        root.addView(directiveView)

        // Fast Action Buttons Row: [Mute Audio], [Disconnect], [Save Proof]
        val actionsRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            weightSum = 3f
        }

        // 1. MUTE CALLER Button
        val muteButton = Button(this).apply {
            text = "MUTE AUDIO"
            textSize = 11f
            setTextColor(Color.WHITE)
            typeface = Typeface.DEFAULT_BOLD
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#1E293B"))
                cornerRadius = dp(8).toFloat()
                setStroke(dp(1), Color.WHITE)
            }
            layoutParams = LinearLayout.LayoutParams(0, dp(40), 1f).apply {
                marginEnd = dp(4)
            }
            setOnClickListener {
                toggleMute()
            }
        }
        actionsRow.addView(muteButton)

        // 2. DISCONNECT Button
        val disconnectButton = Button(this).apply {
            text = "DISCONNECT"
            textSize = 11f
            setTextColor(Color.WHITE)
            typeface = Typeface.DEFAULT_BOLD
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#991B1B"))
                cornerRadius = dp(8).toFloat()
                setStroke(dp(1), Color.WHITE)
            }
            layoutParams = LinearLayout.LayoutParams(0, dp(40), 1f).apply {
                marginEnd = dp(4)
            }
            setOnClickListener {
                disconnectActiveCall()
            }
        }
        actionsRow.addView(disconnectButton)

        // 3. SAVE INCIDENT PROOF Button
        val saveProofButton = Button(this).apply {
            text = "SAVE PROOF"
            textSize = 11f
            setTextColor(Color.WHITE)
            typeface = Typeface.DEFAULT_BOLD
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#0F172A"))
                cornerRadius = dp(8).toFloat()
                setStroke(dp(1), Color.parseColor("#38BDF8"))
            }
            layoutParams = LinearLayout.LayoutParams(0, dp(40), 1f)
            setOnClickListener {
                saveIncidentProof()
            }
        }
        actionsRow.addView(saveProofButton)

        root.addView(actionsRow)
        return root
    }

    private fun saveIncidentProof() {
        try {
            val verdict = lastObservedVerdict ?: ThreatVerdict(
                threatLevel = "CRITICAL",
                compositeRisk = 0.95f,
                identifiedScamType = "Captured Incident",
                liveCoachingDirectives = listOf("Suspicious active call intercepted"),
                auditHash = java.util.UUID.randomUUID().toString().replace("-", ""),
                blockIndex = 1,
                timestamp = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.US).format(java.util.Date()),
                riskScore = 95,
                explanation = "Manual incident proof capture triggered by user during suspected extortion call."
            )
            WebSocketClientManager.instance.recordProof(verdict)
            android.widget.Toast.makeText(this, "Incident proof cryptographically archived to ledger", android.widget.Toast.LENGTH_SHORT).show()
            Log.i(TAG, "Incident proof saved to ledger: ${verdict.auditHash}")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save incident proof: ${e.message}")
        }
    }

    private fun toggleMute() {
        try {
            audioManager?.let { am ->
                val newMute = !am.isMicrophoneMute
                am.isMicrophoneMute = newMute
                Log.i(TAG, "Microphone mute toggled to: $newMute")
                android.widget.Toast.makeText(
                    this,
                    if (newMute) "Microphone Muted" else "Microphone Unmuted",
                    android.widget.Toast.LENGTH_SHORT
                ).show()
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
        try {
            unregisterReceiver(screenShareReceiver)
        } catch (e: Exception) {
            // ignore if not registered
        }
        hideOverlay()
        serviceScope.cancel()
        super.onDestroy()
    }
}
