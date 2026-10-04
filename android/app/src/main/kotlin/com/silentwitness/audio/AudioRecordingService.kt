package com.silentwitness.audio

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import androidx.core.app.NotificationCompat
import com.silentwitness.R
import com.silentwitness.SilentWitnessApp
import com.silentwitness.data.ThreatVerdict
import com.silentwitness.network.WebSocketClientManager
import com.silentwitness.ui.MainActivity
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.*

/**
 * Foreground Audio Recording & Speech Forensic Service.
 * Continuously listens to call audio using Android SpeechRecognizer and pipes
 * 16kHz PCM audio to CallAudioStreamer while executing instant on-device OTP & scam regex filters.
 */
class AudioRecordingService : Service() {

    companion object {
        private const val TAG = "AudioRecordingService"
        private const val NOTIFICATION_ID = 9002

        const val ACTION_START = "com.silentwitness.audio.START_RECORDING"
        const val ACTION_STOP = "com.silentwitness.audio.STOP_RECORDING"

        val OTP_REGEX = Regex("(?i)\\b(otp|one time password|pin|cvv|verification code|security code|four digit|six digit|code sent to your mobile|bank account details|bank details|tell me your otp|bank account)\\b")
        val DIGITAL_ARREST_REGEX = Regex("(?i)\\b(digital arrest|mumbai police|police department|cbi|cbi court order|court order|narcotics|arrest warrant|stay on video|cannot hang up|do not cut this video call|do not hang up|police department calling)\\b")
        val SCREEN_SHARE_REGEX = Regex("(?i)\\b(anydesk|teamviewer|rustdesk|quicksupport|share screen|share your screen|start sharing|open anydesk)\\b")

        fun startService(context: Context) {
            val intent = Intent(context, AudioRecordingService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, AudioRecordingService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }

    private var speechRecognizer: SpeechRecognizer? = null
    private var isListening = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        startForegroundNotification("Call Safety Active", "Analyzing call dialogue for fraud and OTP extraction")
        initSpeechRecognizer()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                Log.i(TAG, "Starting audio forensic pipeline & PCM streaming")
                CallAudioStreamer.startStreaming(this)
                startListening()
            }
            ACTION_STOP -> {
                Log.i(TAG, "Stopping audio forensic pipeline")
                stopListening()
                CallAudioStreamer.stopStreaming()
                stopForeground(STOP_FOREGROUND_REMOVE)
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

    private fun initSpeechRecognizer() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            Log.w(TAG, "Speech recognition not available on this device")
            return
        }

        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this).apply {
            setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) {}
                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {}

                override fun onError(error: Int) {
                    Log.w(TAG, "Speech recognition notice/error code: $error. Re-arming listener.")
                    // Continuously restart listening across errors/silence timeouts during active calls
                    if (isListening) {
                        restartListeningDelay()
                    }
                }

                override fun onResults(results: Bundle?) {
                    handleSpeechResults(results, isFinal = true)
                    if (isListening) {
                        startListening()
                    }
                }

                override fun onPartialResults(partialResults: Bundle?) {
                    handleSpeechResults(partialResults, isFinal = false)
                }

                override fun onEvent(eventType: Int, params: Bundle?) {}
            })
        }
    }

    private fun startListening() {
        if (speechRecognizer == null) initSpeechRecognizer()
        isListening = true

        try {
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, packageName)
            }
            speechRecognizer?.startListening(intent)
            Log.i(TAG, "SpeechRecognizer listening started")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start speech recognizer: ${e.message}")
        }
    }

    private fun restartListeningDelay() {
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            if (isListening) {
                startListening()
            }
        }, 800)
    }

    private fun stopListening() {
        isListening = false
        try {
            speechRecognizer?.stopListening()
            speechRecognizer?.cancel()
        } catch (e: Exception) {
            Log.w(TAG, "Error stopping recognizer: ${e.message}")
        }
    }

    private fun handleSpeechResults(bundle: Bundle?, isFinal: Boolean) {
        val matches = bundle?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) ?: return
        val rawText = matches.firstOrNull() ?: return
        if (rawText.isBlank()) return

        Log.i(TAG, "Transcribed snippet (isFinal=$isFinal): $rawText")

        val timeStr = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())

        // 1. Instant Heuristic Override: Check for OTP demands
        if (OTP_REGEX.containsMatchIn(rawText)) {
            Log.w(TAG, "🚨 CRITICAL HEURISTIC TRIGGER: OTP extraction attempt detected in dialogue!")
            val auditHash = MessageDigest.getInstance("SHA-256")
                .digest("OTP_THEFT:95:$timeStr".toByteArray())
                .joinToString("") { "%02x".format(it) }

            val otpVerdict = ThreatVerdict(
                threatLevel = "CRITICAL",
                compositeRisk = 0.95f,
                identifiedScamType = "OTP / Credential Harvesting Theft",
                liveCoachingDirectives = listOf(
                    "CRITICAL: DO NOT SHARE OTP - BANK OFFICIALS NEVER ASK FOR PASSWORDS",
                    "NEVER read out 4-digit or 6-digit codes received via SMS",
                    "Hang up and call the number printed on your debit card immediately"
                ),
                auditHash = auditHash,
                blockIndex = WebSocketClientManager.instance.auditHistory.value.size + 1,
                timestamp = timeStr,
                maskedTranscript = rawText,
                trustScore = 5,
                riskScore = 95,
                explanation = "Live spoken dialogue analysis detected an urgent demand for one-time passwords (OTP) or authentication codes."
            )
            WebSocketClientManager.instance.injectLocalVerdict(otpVerdict)
        }

        // 2. Check for Digital Arrest or Remote Access Coercion
        if (DIGITAL_ARREST_REGEX.containsMatchIn(rawText)) {
            Log.w(TAG, "🚨 CRITICAL HEURISTIC TRIGGER: Digital arrest coercion detected!")
            val auditHash = MessageDigest.getInstance("SHA-256")
                .digest("DIGITAL_ARREST:96:$timeStr".toByteArray())
                .joinToString("") { "%02x".format(it) }

            val arrestVerdict = ThreatVerdict(
                threatLevel = "CRITICAL_ATTACK_DETECTED",
                compositeRisk = 0.96f,
                identifiedScamType = "Digital Arrest / Law Enforcement Extortion",
                liveCoachingDirectives = listOf(
                    "POLICE NEVER CONDUCT INQUIRY ON WHATSAPP",
                    "CRITICAL: Digital arrest does NOT exist under Indian law.",
                    "Police, CBI, and Customs NEVER conduct arrests over video or phone calls.",
                    "Do NOT transfer funds for 'verification' or security clearance."
                ),
                auditHash = auditHash,
                blockIndex = WebSocketClientManager.instance.auditHistory.value.size + 1,
                timestamp = timeStr,
                maskedTranscript = rawText,
                trustScore = 4,
                riskScore = 96,
                explanation = "Caller is falsely claiming to be law enforcement and threatening digital arrest."
            )
            WebSocketClientManager.instance.injectLocalVerdict(arrestVerdict)
        }

        // 3. Pipe to WebSocket and local engine
        WebSocketClientManager.instance.sendSpeechSnippet(rawText, isFinal = isFinal)
    }

    override fun onDestroy() {
        stopListening()
        speechRecognizer?.destroy()
        speechRecognizer = null
        CallAudioStreamer.stopStreaming()
        super.onDestroy()
    }
}
