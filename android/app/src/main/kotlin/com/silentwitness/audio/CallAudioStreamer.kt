package com.silentwitness.audio

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Base64
import android.util.Log
import com.silentwitness.network.WebSocketClientManager
import com.silentwitness.screenshare.ScreenShareDetector
import kotlinx.coroutines.*
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.sqrt

/**
 * High-Performance Call Audio Streamer with Voice Activity Detection (VAD).
 * Intercepts call audio stream frames, filters silence, and pipes 16kHz 16-bit PCM chunks
 * to the backend WebSocket for real-time acoustic forensics and LLM scam classification.
 */
object CallAudioStreamer {

    private const val TAG = "CallAudioStreamer"
    private const val SAMPLE_RATE = 16000
    private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
    private const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
    private const val VAD_RMS_THRESHOLD = 300.0 // Energy threshold for active speech detection

    private val isRecording = AtomicBoolean(false)
    private var recordingJob: Job? = null
    private val streamerScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    @SuppressLint("MissingPermission")
    fun startStreaming(context: Context) {
        if (isRecording.getAndSet(true)) {
            Log.i(TAG, "Audio streaming is already active.")
            return
        }

        recordingJob = streamerScope.launch {
            val minBufferSize = AudioRecord.getMinBufferSize(
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT
            )
            val bufferSize = maxOf(minBufferSize, SAMPLE_RATE * 2) // 1 second buffer
            val chunkSize = 3200 // 100ms frames at 16kHz 16-bit (1600 samples * 2 bytes)
            val audioBuffer = ShortArray(chunkSize / 2)
            val screenShareDetector = ScreenShareDetector(context)

            var audioRecord: AudioRecord? = null
            try {
                // Try voice communication / mic source
                val audioSource = MediaRecorder.AudioSource.VOICE_COMMUNICATION
                audioRecord = AudioRecord(
                    audioSource,
                    SAMPLE_RATE,
                    CHANNEL_CONFIG,
                    AUDIO_FORMAT,
                    bufferSize
                )

                if (audioRecord.state != AudioRecord.STATE_INITIALIZED) {
                    Log.w(TAG, "AudioRecord initialization failed, falling back to MIC source.")
                    audioRecord.release()
                    audioRecord = AudioRecord(
                        MediaRecorder.AudioSource.MIC,
                        SAMPLE_RATE,
                        CHANNEL_CONFIG,
                        AUDIO_FORMAT,
                        bufferSize
                    )
                }

                if (audioRecord.state != AudioRecord.STATE_INITIALIZED) {
                    Log.e(TAG, "Failed to initialize AudioRecord on any available source.")
                    isRecording.set(false)
                    return@launch
                }

                audioRecord.startRecording()
                Log.i(TAG, "Audio recording and VAD pipe initialized at ${SAMPLE_RATE}Hz")

                // Accumulate voiced chunks into 0.5s blocks before network transmission
                val pcmAccumulator = java.io.ByteArrayOutputStream()
                var voicedFrameCount = 0

                while (isActive && isRecording.get()) {
                    val readShorts = audioRecord.read(audioBuffer, 0, audioBuffer.size)
                    if (readShorts <= 0) continue

                    // 1. Calculate RMS Energy for Voice Activity Detection
                    var sumSquare = 0.0
                    for (i in 0 until readShorts) {
                        val sample = audioBuffer[i].toDouble()
                        sumSquare += sample * sample
                    }
                    val rms = sqrt(sumSquare / readShorts)
                    val isVoiced = rms >= VAD_RMS_THRESHOLD

                    // Convert short array to little-endian bytes
                    val byteBuffer = java.nio.ByteBuffer.allocate(readShorts * 2)
                        .order(java.nio.ByteOrder.LITTLE_ENDIAN)
                    for (i in 0 until readShorts) {
                        byteBuffer.putShort(audioBuffer[i])
                    }

                    if (isVoiced) {
                        pcmAccumulator.write(byteBuffer.array())
                        voicedFrameCount++
                    }

                    // 2. Transmit after ~500ms of voiced frames (5 chunks of 100ms)
                    if (voicedFrameCount >= 5 || pcmAccumulator.size() >= 16000) {
                        val pcmBytes = pcmAccumulator.toByteArray()
                        pcmAccumulator.reset()
                        voicedFrameCount = 0

                        val base64Data = Base64.encodeToString(pcmBytes, Base64.NO_WRAP)
                        val isScreenShareActive = screenShareDetector.isScreenCaptureActive()

                        WebSocketClientManager.instance.sendAudioChunk(
                            audioBase64 = base64Data,
                            isFinal = false,
                            hasScreenShare = isScreenShareActive
                        )
                    }
                }
            } catch (e: SecurityException) {
                Log.e(TAG, "RECORD_AUDIO permission missing: ${e.message}")
            } catch (e: Exception) {
                Log.e(TAG, "Error in audio capture pipeline: ${e.message}")
            } finally {
                try {
                    audioRecord?.stop()
                    audioRecord?.release()
                } catch (e: Exception) {
                    Log.w(TAG, "Error releasing AudioRecord: ${e.message}")
                }
                isRecording.set(false)
                Log.i(TAG, "Audio streaming stopped.")
            }
        }
    }

    fun stopStreaming() {
        if (!isRecording.get()) return
        isRecording.set(false)
        recordingJob?.cancel()
        recordingJob = null
    }

    fun isStreaming(): Boolean = isRecording.get()
}
