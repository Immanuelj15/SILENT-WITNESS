package com.silentwitness.data

import com.google.gson.annotations.SerializedName

data class ThreatVerdict(
    @SerializedName("threat_level")
    val threatLevel: String = "SAFE",

    @SerializedName("composite_risk")
    val compositeRisk: Float = 0.05f,

    @SerializedName("identified_scam_type")
    val identifiedScamType: String = "Routine Conversation",

    @SerializedName("live_coaching_directives")
    val liveCoachingDirectives: List<String> = emptyList(),

    @SerializedName("audit_hash")
    val auditHash: String = "",

    @SerializedName("block_index")
    val blockIndex: Int = 0,

    @SerializedName("timestamp")
    val timestamp: String = "",

    @SerializedName("masked_transcript")
    val maskedTranscript: String = "",

    @SerializedName("trustScore")
    val trustScore: Int = 95,

    @SerializedName("riskScore")
    val riskScore: Int = 5,

    @SerializedName("deepfake_confidence")
    val deepfakeConfidence: Float = 0.0f,

    @SerializedName("screen_share_risk")
    val screenShareRisk: Boolean = false,

    @SerializedName("explanation")
    val explanation: String = ""
)

data class AuditRecordItem(
    val blockIndex: Int,
    val timestamp: String,
    val auditHash: String,
    val threatLevel: String,
    val scamType: String,
    val snippet: String
)

data class OverlayState(
    val isVisible: Boolean = false,
    val threatLevel: String = "SAFE",
    val bannerTitle: String = "",
    val bannerMessage: String = "",
    val directives: List<String> = emptyList(),
    val riskPercentage: Int = 5
)

data class CallSessionInfo(
    val callerNumber: String = "Unknown Contact",
    val callerName: String? = null,
    val channel: String = "SIM Cellular",
    val startTime: Long = System.currentTimeMillis(),
    val isShieldActive: Boolean = true
)
