package com.silentwitness.overlay

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.media.AudioManager
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import android.telecom.TelecomManager
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.NotificationCompat
import com.silentwitness.R
import com.silentwitness.SilentWitnessApp
import com.silentwitness.data.ThreatVerdict
import com.silentwitness.network.WebSocketClientManager
import com.silentwitness.screenshare.ScreenShareDetector
import com.silentwitness.ui.MainActivity
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.collectLatest
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

/**
 * Guardian Floating Warning Overlay (Heads-Up Display - HUD).
 * Foreground service drawing dynamic, interactive warning banners on top of
 * third-party call windows (WhatsApp, Telegram, Cellular dialer).
 *
 * Implements:
 * 1. 3-Tier Visual HUD: Safe (Green #10B981), Caution (Amber #F59E0B), Critical (Red #EF4444).
 * 2. Live Defense Warnings (Dynamic Coaching Directives List).
 * 3. Haptic Vibration Feedback on Critical Attacks.
 * 4. Emergency Action Buttons: [Mute Audio], [Terminate Call], [Save Evidence].
 * 5. Live Risk Percentage Gauge (0% - 100%).
 */
class GuardianOverlayService : Service() {

    companion object {
        private const val TAG = "GuardianOverlayService"
        const val ACTION_START = "com.silentwitness.action.START_OVERLAY"
        const val ACTION_STOP = "com.silentwitness.action.STOP_OVERLAY"
        const val ACTION_SIMULATE_ALERT = "com.silentwitness.action.SIMULATE_ALERT"
        const val EXTRA_THREAT_TYPE = "extra_threat_type"
        const val EXTRA_MESSAGE = "extra_message"
        private const val NOTIFICATION_ID = 9001

        // Color Palettes
        const val COLOR_SAFE_GREEN = "#10B981"      // Pacha (Safe)
        const val COLOR_CAUTION_AMBER = "#F59E0B"   // Manja (Caution)
        const val COLOR_CRITICAL_RED = "#EF4444"    // Chuvappu (Critical)

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

    enum class ThreatTier {
        SAFE, CAUTION, CRITICAL
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var isOverlayVisible = false
    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var audioManager: AudioManager? = null
    private var lastObservedVerdict: ThreatVerdict? = null

    private var muteButtonRef: Button? = null
    private var riskGaugeLabelRef: TextView? = null
    private var riskProgressBarRef: ProgressBar? = null
    private var directivesContainerRef: LinearLayout? = null
    private var titleViewRef: TextView? = null

    private val screenShareReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == ScreenShareDetector.ACTION_SCREEN_SHARE_DETECTED) {
                val reason = intent.getStringExtra(ScreenShareDetector.EXTRA_DETECTION_REASON)
                    ?: "Unauthorized remote screen share active"
                Log.w(TAG, "Screen share threat broadcast received: $reason")
                triggerCriticalHapticFeedback()
                showOverlay(
                    tier = ThreatTier.CRITICAL,
                    bannerTitle = "🚨 CRITICAL: DO NOT SHARE OTP / REMOTE ACCESS DETECTED",
                    directives = listOf(
                        "DO NOT INSTALL REMOTE APPS",
                        "DO NOT SHARE OTP OR PASSWORDS",
                        "Scammers can see your screen and banking credentials."
                    ),
                    riskScore = 98
                )
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as? WindowManager
        audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager

        startForegroundNotification("Guardian Active", "Monitoring ongoing communication for scam threats")
        observeThreatVerdicts()

        try {
            val filter = IntentFilter(ScreenShareDetector.ACTION_SCREEN_SHARE_DETECTED)
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
                if (!isOverlayVisible) {
                    showOverlay(
                        tier = ThreatTier.SAFE,
                        bannerTitle = "🛡️ GUARDIAN SHIELD ACTIVE - MONITORING CALL",
                        directives = listOf(
                            "Silent Witness active over active call.",
                            "Real-time AI scam detection running."
                        ),
                        riskScore = 5
                    )
                }
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
        val threatLevel = verdict.threatLevel.uppercase()
        val scamType = verdict.identifiedScamType
        val directives = verdict.liveCoachingDirectives.ifEmpty {
            listOf("Protect your banking credentials. Stay alert.")
        }
        val riskScore = verdict.riskScore

        when {
            threatLevel == "CRITICAL" || threatLevel == "CRITICAL_ATTACK_DETECTED" || riskScore >= 80 -> {
                triggerCriticalHapticFeedback()
                val title = if (scamType.contains("Digital Arrest", ignoreCase = true)) {
                    "🚨 SUSPECTED DIGITAL ARREST - LAW ENFORCEMENT DOES NOT USE WHATSAPP"
                } else {
                    "🚨 CRITICAL SCAM DETECTED: DO NOT SHARE OTP / REMOTE ACCESS APP"
                }
                showOverlay(
                    tier = ThreatTier.CRITICAL,
                    bannerTitle = title,
                    directives = directives,
                    riskScore = riskScore
                )
            }
            threatLevel == "HIGH" || riskScore >= 40 -> {
                val title = if (scamType.contains("Digital Arrest", ignoreCase = true)) {
                    "⚠️ SUSPECTED DIGITAL ARREST - LAW ENFORCEMENT DOES NOT USE WHATSAPP"
                } else {
                    "⚠️ CAUTION: SUSPECTED SENSITIVE DEMAND DETECTED"
                }
                showOverlay(
                    tier = ThreatTier.CAUTION,
                    bannerTitle = title,
                    directives = directives,
                    riskScore = riskScore
                )
            }
            else -> {
                // Safe / Normal status display (Pacha / Green)
                showOverlay(
                    tier = ThreatTier.SAFE,
                    bannerTitle = "🛡️ CALL SECURED - NO THREATS DETECTED",
                    directives = listOf(
                        "Silent Witness shield active.",
                        "Conversational patterns appear normal."
                    ),
                    riskScore = maxOf(5, riskScore)
                )
            }
        }
    }

    private fun simulateThreat(threatType: String, customMessage: String?) {
        when (threatType.uppercase()) {
            "DIGITAL_ARREST" -> {
                triggerCriticalHapticFeedback()
                showOverlay(
                    tier = ThreatTier.CAUTION,
                    bannerTitle = "⚠️ SUSPECTED DIGITAL ARREST - LAW ENFORCEMENT DOES NOT USE WHATSAPP",
                    directives = listOf(
                        customMessage ?: "POLICE NEVER CONDUCT INQUIRY ON WHATSAPP",
                        "DO NOT TRANSFER CLEARANCE FEES",
                        "Police never issue arrest warrants over video calls."
                    ),
                    riskScore = 92
                )
            }
            "REMOTE_ACCESS", "OTP" -> {
                triggerCriticalHapticFeedback()
                showOverlay(
                    tier = ThreatTier.CRITICAL,
                    bannerTitle = "🚨 CRITICAL SCAM DETECTED: DO NOT SHARE OTP / REMOTE ACCESS APP",
                    directives = listOf(
                        customMessage ?: "DO NOT SHARE OTP",
                        "DO NOT INSTALL REMOTE APPS (AnyDesk / TeamViewer)",
                        "Demanding banking passwords or remote access detected."
                    ),
                    riskScore = 96
                )
            }
            else -> {
                showOverlay(
                    tier = ThreatTier.SAFE,
                    bannerTitle = "🛡️ CALL SECURED - NO THREATS DETECTED",
                    directives = listOf(
                        "Baseline conversational safety verified.",
                        "Maintain standard vigilance."
                    ),
                    riskScore = 5
                )
            }
        }
    }

    private fun triggerCriticalHapticFeedback() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                val vibrator = vibratorManager?.defaultVibrator
                val pattern = longArrayOf(0, 350, 120, 350, 120, 500)
                val effect = VibrationEffect.createWaveform(pattern, -1)
                vibrator?.vibrate(effect)
            } else {
                @Suppress("DEPRECATION")
                val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val pattern = longArrayOf(0, 350, 120, 350, 120, 500)
                    val effect = VibrationEffect.createWaveform(pattern, -1)
                    vibrator?.vibrate(effect)
                } else {
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(500)
                }
            }
            Log.i(TAG, "Critical threat haptic vibration pulse fired.")
        } catch (e: Exception) {
            Log.w(TAG, "Notice executing haptic feedback: ${e.message}")
        }
    }

    private fun showOverlay(
        tier: ThreatTier,
        bannerTitle: String,
        directives: List<String>,
        riskScore: Int
    ) {
        if (!Settings.canDrawOverlays(this)) {
            Log.w(TAG, "Cannot show overlay: SYSTEM_ALERT_WINDOW permission missing")
            return
        }

        serviceScope.launch(Dispatchers.Main) {
            if (isOverlayVisible && overlayView != null) {
                updateOverlayContent(tier, bannerTitle, directives, riskScore)
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
                y = 50
            }

            val rootLayout = buildOverlayView(tier, bannerTitle, directives, riskScore)
            overlayView = rootLayout

            try {
                windowManager?.addView(rootLayout, layoutParams)
                isOverlayVisible = true
                Log.i(TAG, "Guardian Overlay HUD displayed successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to add window overlay HUD: ${e.message}")
            }
        }
    }

    private fun updateOverlayContent(
        tier: ThreatTier,
        title: String,
        directives: List<String>,
        riskScore: Int
    ) {
        val root = overlayView as? LinearLayout ?: return
        val density = resources.displayMetrics.density
        fun dp(v: Int): Int = (v * density).toInt()

        val themeColor = when (tier) {
            ThreatTier.SAFE -> Color.parseColor(COLOR_SAFE_GREEN)
            ThreatTier.CAUTION -> Color.parseColor(COLOR_CAUTION_AMBER)
            ThreatTier.CRITICAL -> Color.parseColor(COLOR_CRITICAL_RED)
        }

        titleViewRef?.text = title

        // 1. Update live risk progress and percentage
        riskGaugeLabelRef?.text = "AI RISK GAUGE: $riskScore%"
        riskProgressBarRef?.progress = riskScore
        riskProgressBarRef?.progressTintList = android.content.res.ColorStateList.valueOf(themeColor)

        // 2. Update dynamic coaching directives list view
        directivesContainerRef?.let { container ->
            container.removeAllViews()
            directives.forEach { directive ->
                val row = TextView(this).apply {
                    text = "• $directive"
                    setTextColor(Color.parseColor("#F8FAFC"))
                    textSize = 12f
                    typeface = Typeface.DEFAULT_BOLD
                    setPadding(0, dp(2), 0, dp(2))
                }
                container.addView(row)
            }
        }

        // 3. Update root background styling
        val bgDrawable = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = dp(16).toFloat()
            setColor(themeColor)
            setStroke(dp(2), Color.WHITE)
        }
        root.background = bgDrawable

        // 4. Update Mute button state
        val isMuted = audioManager?.isMicrophoneMute == true
        muteButtonRef?.text = if (isMuted) "UNMUTE" else "MUTE AUDIO"
    }

    private fun buildOverlayView(
        tier: ThreatTier,
        title: String,
        directives: List<String>,
        riskScore: Int
    ): View {
        val density = resources.displayMetrics.density
        fun dp(value: Int): Int = (value * density).toInt()

        val themeColor = when (tier) {
            ThreatTier.SAFE -> Color.parseColor(COLOR_SAFE_GREEN)
            ThreatTier.CAUTION -> Color.parseColor(COLOR_CAUTION_AMBER)
            ThreatTier.CRITICAL -> Color.parseColor(COLOR_CRITICAL_RED)
        }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(14), dp(16), dp(14))

            val bg = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = dp(16).toFloat()
                setColor(themeColor)
                setStroke(dp(2), Color.WHITE)
            }
            background = bg
            elevation = dp(12).toFloat()
        }

        // --- Header Title Row with Dismiss icon ---
        val headerRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            weightSum = 1f
        }

        val titleView = TextView(this).apply {
            id = R.id.overlay_title
            text = title
            setTextColor(Color.WHITE)
            textSize = 13.5f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.START
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 0.9f)
            setPadding(0, 0, dp(4), dp(2))
        }
        titleViewRef = titleView
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

        // --- Feature 5: Live Risk Percentage Gauge (0% - 100%) ---
        val riskHeaderRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, dp(4), 0, dp(2))
        }

        val riskLabel = TextView(this).apply {
            text = "AI RISK GAUGE: $riskScore%"
            setTextColor(Color.parseColor("#FEF2F2"))
            textSize = 11.5f
            typeface = Typeface.DEFAULT_BOLD
        }
        riskGaugeLabelRef = riskLabel
        riskHeaderRow.addView(riskLabel)
        root.addView(riskHeaderRow)

        val progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            progress = riskScore
            progressTintList = android.content.res.ColorStateList.valueOf(themeColor)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(6)
            ).apply {
                setMargins(0, dp(2), 0, dp(8))
            }
        }
        riskProgressBarRef = progressBar
        root.addView(progressBar)

        // --- Feature 2: Live Defense Warnings (Dynamic Coaching Directives List View) ---
        val directivesContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, 0, 0, dp(12))
        }
        directivesContainerRef = directivesContainer

        directives.forEach { directive ->
            val row = TextView(this).apply {
                text = "• $directive"
                setTextColor(Color.parseColor("#F8FAFC"))
                textSize = 12f
                typeface = Typeface.DEFAULT_BOLD
                setPadding(0, dp(2), 0, dp(2))
            }
            directivesContainer.addView(row)
        }
        root.addView(directivesContainer)

        // --- Feature 4: Emergency Action Buttons Row: [Mute Audio], [Terminate Call], [Save Evidence] ---
        val actionsRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            weightSum = 3f
        }

        // 1. MUTE AUDIO Button
        val isMuted = audioManager?.isMicrophoneMute == true
        val muteButton = Button(this).apply {
            text = if (isMuted) "UNMUTE" else "MUTE AUDIO"
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
        muteButtonRef = muteButton
        actionsRow.addView(muteButton)

        // 2. TERMINATE CALL Button
        val terminateButton = Button(this).apply {
            text = "TERMINATE"
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
                terminateActiveCall()
            }
        }
        actionsRow.addView(terminateButton)

        // 3. SAVE EVIDENCE Button
        val saveEvidenceButton = Button(this).apply {
            text = "SAVE EVIDENCE"
            textSize = 10.5f
            setTextColor(Color.WHITE)
            typeface = Typeface.DEFAULT_BOLD
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#0F172A"))
                cornerRadius = dp(8).toFloat()
                setStroke(dp(1), Color.parseColor("#38BDF8"))
            }
            layoutParams = LinearLayout.LayoutParams(0, dp(40), 1f)
            setOnClickListener {
                saveEvidenceToLedger()
            }
        }
        actionsRow.addView(saveEvidenceButton)

        root.addView(actionsRow)
        return root
    }

    private fun toggleMute() {
        try {
            audioManager?.let { am ->
                val newMute = !am.isMicrophoneMute
                am.isMicrophoneMute = newMute
                muteButtonRef?.text = if (newMute) "UNMUTE" else "MUTE AUDIO"
                Log.i(TAG, "Microphone mute state toggled to: $newMute")
                Toast.makeText(
                    this,
                    if (newMute) "Microphone Muted - Attacker cannot hear you" else "Microphone Unmuted",
                    Toast.LENGTH_SHORT
                ).show()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to toggle mute: ${e.message}")
        }
    }

    private fun terminateActiveCall() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val telecomManager = getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
                @Suppress("MissingPermission")
                telecomManager?.endCall()
                Log.i(TAG, "Call disconnection requested via TelecomManager")
            }
            Toast.makeText(this, "Call terminated by Silent Witness Guardian", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Log.w(TAG, "Notice terminating call: ${e.message}")
        }
        saveEvidenceToLedger()
        hideOverlay()

        val navIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("EXTRA_NAVIGATE_TAB", "EVIDENCE")
        }
        startActivity(navIntent)
    }

    private fun saveEvidenceToLedger() {
        try {
            val timeStr = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())
            val verdict = lastObservedVerdict ?: ThreatVerdict(
                threatLevel = "CRITICAL",
                compositeRisk = 0.95f,
                identifiedScamType = "Manual Evidence Capture",
                liveCoachingDirectives = listOf("Suspicious active call intercepted"),
                auditHash = "",
                blockIndex = WebSocketClientManager.instance.auditHistory.value.size + 1,
                timestamp = timeStr,
                riskScore = 95,
                explanation = "Manual evidence proof capture initiated by user during suspected extortion call."
            )

            // Cryptographic SHA-256 Merkle block hash
            val auditHash = if (verdict.auditHash.isNotEmpty()) {
                verdict.auditHash
            } else {
                MessageDigest.getInstance("SHA-256")
                    .digest("${verdict.identifiedScamType}:${verdict.riskScore}:$timeStr".toByteArray())
                    .joinToString("") { "%02x".format(it) }
            }

            val finalVerdict = verdict.copy(auditHash = auditHash)
            WebSocketClientManager.instance.recordProof(finalVerdict)
            Toast.makeText(this, "Evidence cryptographically archived to Merkle ledger", Toast.LENGTH_SHORT).show()
            Log.i(TAG, "Evidence stored in ledger: $auditHash")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save evidence to ledger: ${e.message}")
        }
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
        overlayView = null
        windowManager = null
        muteButtonRef = null
        riskGaugeLabelRef = null
        riskProgressBarRef = null
        directivesContainerRef = null
        titleViewRef = null
        super.onDestroy()
    }
}
