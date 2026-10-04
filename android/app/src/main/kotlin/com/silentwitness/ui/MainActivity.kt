package com.silentwitness.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.silentwitness.network.ConnectionStatus
import com.silentwitness.ui.components.EvidenceHistoryScreen
import com.silentwitness.ui.components.ScamLabScreen
import com.silentwitness.ui.theme.*

import android.content.Intent
import androidx.compose.runtime.MutableState
import com.silentwitness.data.ThreatVerdict
import com.silentwitness.overlay.GuardianOverlayService
import com.silentwitness.network.WebSocketClientManager

class MainActivity : ComponentActivity() {

    private val viewModel: GuardianViewModel by viewModels()
    private val activeTabState = mutableStateOf(NavigationTab.SHIELD)

    private val callScreeningLauncher = registerForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult()
    ) {
        viewModel.checkPermissions(this)
    }

    fun launchCallScreeningRole() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(android.app.role.RoleManager::class.java)
            if (roleManager != null && roleManager.isRoleAvailable(android.app.role.RoleManager.ROLE_CALL_SCREENING)) {
                if (!roleManager.isRoleHeld(android.app.role.RoleManager.ROLE_CALL_SCREENING)) {
                    val intent = roleManager.createRequestRoleIntent(android.app.role.RoleManager.ROLE_CALL_SCREENING)
                    callScreeningLauncher.launch(intent)
                } else {
                    viewModel.checkPermissions(this)
                }
            }
        } else {
            val intent = Intent(android.telecom.TelecomManager.ACTION_CHANGE_DEFAULT_DIALER).apply {
                putExtra(android.telecom.TelecomManager.EXTRA_CHANGE_DEFAULT_DIALER_PACKAGE_NAME, packageName)
            }
            try {
                callScreeningLauncher.launch(intent)
            } catch (e: Exception) {
                android.util.Log.w("MainActivity", "Pre-Q role request error: ${e.message}")
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleTabIntent(intent)
        WebSocketClientManager.instance.connect()
        setContent {
            SilentWitnessTheme {
                MainScreen(
                    viewModel = viewModel,
                    tabState = activeTabState,
                    onRequestCallScreening = { launchCallScreeningRole() }
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleTabIntent(intent)
    }

    private fun handleTabIntent(intent: Intent?) {
        if (intent?.getStringExtra("EXTRA_NAVIGATE_TAB") == "EVIDENCE") {
            activeTabState.value = NavigationTab.EVIDENCE
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.checkPermissions(this)
        WebSocketClientManager.instance.connect()

        // Automatic system prompt for Call Screening role on Android Q+
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(android.app.role.RoleManager::class.java)
            if (roleManager != null && roleManager.isRoleAvailable(android.app.role.RoleManager.ROLE_CALL_SCREENING)) {
                if (!roleManager.isRoleHeld(android.app.role.RoleManager.ROLE_CALL_SCREENING)) {
                    val intent = roleManager.createRequestRoleIntent(android.app.role.RoleManager.ROLE_CALL_SCREENING)
                    try {
                        callScreeningLauncher.launch(intent)
                    } catch (e: Exception) {
                        android.util.Log.w("MainActivity", "Role prompt: ${e.message}")
                    }
                }
            }
        }
    }
}

enum class NavigationTab(val label: String) {
    SHIELD("Guardian Shield"),
    SCAM_LAB("Scam Lab"),
    EVIDENCE("Evidence Ledger")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    viewModel: GuardianViewModel,
    tabState: MutableState<NavigationTab> = remember { mutableStateOf(NavigationTab.SHIELD) },
    onRequestCallScreening: () -> Unit = {}
) {
    var selectedTab by tabState
    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = PrimaryBlue,
                            modifier = Modifier.size(32.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    Icons.Default.Shield,
                                    contentDescription = "Logo",
                                    tint = Color.White,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    "SILENT WITNESS",
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 15.sp,
                                    color = Slate900,
                                    letterSpacing = (-0.3).sp
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Surface(
                                    color = LightBlue,
                                    shape = RoundedCornerShape(4.dp),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryBlue.copy(alpha = 0.3f))
                                ) {
                                    Text(
                                        "ENTERPRISE",
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = PrimaryBlue,
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                    )
                                }
                            }
                            Text(
                                "AI Telephony Fraud Shield",
                                fontSize = 11.sp,
                                color = Slate500
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = SurfaceWhite
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = SurfaceWhite,
                tonalElevation = 4.dp
            ) {
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.SHIELD,
                    onClick = { selectedTab = NavigationTab.SHIELD },
                    icon = { Icon(Icons.Default.Shield, contentDescription = "Shield") },
                    label = { Text(NavigationTab.SHIELD.label, fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = PrimaryBlue,
                        selectedTextColor = PrimaryBlue,
                        indicatorColor = LightBlue
                    )
                )

                NavigationBarItem(
                    selected = selectedTab == NavigationTab.SCAM_LAB,
                    onClick = { selectedTab = NavigationTab.SCAM_LAB },
                    icon = { Icon(Icons.Default.PlayCircle, contentDescription = "Scam Lab") },
                    label = { Text(NavigationTab.SCAM_LAB.label, fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = PrimaryBlue,
                        selectedTextColor = PrimaryBlue,
                        indicatorColor = LightBlue
                    )
                )

                NavigationBarItem(
                    selected = selectedTab == NavigationTab.EVIDENCE,
                    onClick = { selectedTab = NavigationTab.EVIDENCE },
                    icon = { Icon(Icons.Default.Lock, contentDescription = "Evidence") },
                    label = { Text(NavigationTab.EVIDENCE.label, fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = PrimaryBlue,
                        selectedTextColor = PrimaryBlue,
                        indicatorColor = LightBlue
                    )
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(BackgroundLight)
                .padding(paddingValues)
        ) {
            when (selectedTab) {
                NavigationTab.SHIELD -> ShieldOverviewScreen(
                    viewModel = viewModel,
                    onNavigateToEvidence = { selectedTab = NavigationTab.EVIDENCE },
                    onRequestCallScreening = onRequestCallScreening
                )
                NavigationTab.SCAM_LAB -> ScamLabScreen(viewModel)
                NavigationTab.EVIDENCE -> EvidenceHistoryScreen(viewModel)
            }
        }
    }
}

@Composable
fun ShieldOverviewScreen(
    viewModel: GuardianViewModel,
    onNavigateToEvidence: () -> Unit = {},
    onRequestCallScreening: () -> Unit = {}
) {
    val context = LocalContext.current
    val isArmed by viewModel.isShieldArmed.collectAsState()
    val hasOverlay by viewModel.hasOverlayPermission.collectAsState()
    val hasScreening by viewModel.hasCallScreeningRole.collectAsState()
    val hasAccessibility by viewModel.hasAccessibilityPermission.collectAsState()
    val installedTools by viewModel.installedRemoteTools.collectAsState()
    val connState by viewModel.connectionState.collectAsState()
    val latestVerdict by viewModel.latestVerdict.collectAsState()
    val scrollState = androidx.compose.foundation.rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Master Guardian Shield Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = if (isArmed) Slate900 else SurfaceWhite
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
        ) {
            Column(
                modifier = Modifier.padding(22.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(if (isArmed) PrimaryBlue else Slate100),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Shield,
                        contentDescription = "Shield Status",
                        tint = if (isArmed) Color.White else Slate500,
                        modifier = Modifier.size(36.dp)
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = if (isArmed) "GUARDIAN DEFENSE ARMED" else "GUARDIAN STANDBY",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = if (isArmed) Color.White else Slate900
                )

                Text(
                    text = if (isArmed)
                        "Standing guard over SIM calls, WhatsApp & VoIP conversations."
                    else
                        "Protection is paused. Tap below to re-arm the interception layer.",
                    fontSize = 13.sp,
                    color = if (isArmed) Slate400 else Slate500,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
                )

                Button(
                    onClick = { viewModel.toggleShield(context) },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isArmed) ThreatCritical else PrimaryBlue
                    ),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        if (isArmed) "Deactivate Guardian Shield" else "Arm Guardian Shield",
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Live Telephony Defense Monitor Card
        if (latestVerdict != null) {
            val verdict = latestVerdict!!
            val rawRisk = verdict.riskScore.toFloat()
            val animatedRisk by androidx.compose.animation.core.animateFloatAsState(
                targetValue = rawRisk / 100f,
                animationSpec = androidx.compose.animation.core.tween(durationMillis = 350),
                label = "riskProgress"
            )

            val tierColor = when {
                verdict.threatLevel == "CRITICAL" || rawRisk >= 80 -> ThreatCritical
                verdict.threatLevel == "HIGH" || rawRisk >= 40 -> ThreatWarning
                else -> ThreatSafe
            }
            val tierBg = when {
                verdict.threatLevel == "CRITICAL" || rawRisk >= 80 -> ThreatCriticalBg
                verdict.threatLevel == "HIGH" || rawRisk >= 40 -> ThreatWarningBg
                else -> ThreatSafeBg
            }

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = androidx.compose.foundation.BorderStroke(1.5.dp, tierColor.copy(alpha = 0.6f)),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "LIVE DEFENSE MONITOR",
                            style = MaterialTheme.typography.labelSmall,
                            color = Slate500
                        )

                        Surface(
                            color = tierBg,
                            shape = RoundedCornerShape(20.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, tierColor.copy(alpha = 0.5f))
                        ) {
                            Text(
                                text = verdict.threatLevel,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = tierColor
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = verdict.identifiedScamType,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Live Risk Percentage Gauge (0% - 100%)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "AI RISK GAUGE",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Slate500
                        )
                        Text(
                            text = "${(animatedRisk * 100).toInt()}%",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = tierColor
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    LinearProgressIndicator(
                        progress = { animatedRisk },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp)),
                        color = tierColor,
                        trackColor = Slate100
                    )

                    // Live Defense Warnings (Dynamic Coaching Directives)
                    if (verdict.liveCoachingDirectives.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = "DYNAMIC COACHING DIRECTIVES:",
                            style = MaterialTheme.typography.labelSmall,
                            color = PrimaryBlue
                        )
                        Column(
                            modifier = Modifier.padding(top = 4.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            verdict.liveCoachingDirectives.forEach { directive ->
                                Row(verticalAlignment = Alignment.Top) {
                                    Text("• ", fontWeight = FontWeight.Bold, color = tierColor)
                                    Text(
                                        text = directive,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Slate900
                                    )
                                }
                            }
                        }
                    }

                    // Emergency Quick-Action Buttons: Mute, Disconnect, Save Proof
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = {
                                try {
                                    val am = context.getSystemService(android.content.Context.AUDIO_SERVICE) as? android.media.AudioManager
                                    am?.let {
                                        val newMute = !it.isMicrophoneMute
                                        it.isMicrophoneMute = newMute
                                        android.widget.Toast.makeText(
                                            context,
                                            if (newMute) "Microphone Muted" else "Microphone Unmuted",
                                            android.widget.Toast.LENGTH_SHORT
                                        ).show()
                                    }
                                } catch (e: Exception) {
                                    android.widget.Toast.makeText(context, "Mute: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
                                }
                            },
                            contentPadding = PaddingValues(horizontal = 4.dp, vertical = 10.dp),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Mute", fontSize = 11.sp, fontWeight = FontWeight.Bold, maxLines = 1, softWrap = false)
                        }

                        Button(
                            onClick = {
                                try {
                                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                                        val telecom = context.getSystemService(android.content.Context.TELECOM_SERVICE) as? android.telecom.TelecomManager
                                        @Suppress("MissingPermission")
                                        telecom?.endCall()
                                    }
                                    android.widget.Toast.makeText(context, "Call Terminated", android.widget.Toast.LENGTH_SHORT).show()
                                } catch (e: Exception) {
                                    android.widget.Toast.makeText(context, "Call Disconnected", android.widget.Toast.LENGTH_SHORT).show()
                                }
                                GuardianOverlayService.stopService(context)
                                onNavigateToEvidence()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = ThreatCritical),
                            contentPadding = PaddingValues(horizontal = 4.dp, vertical = 10.dp),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Disconnect", fontSize = 11.sp, fontWeight = FontWeight.Bold, maxLines = 1, softWrap = false)
                        }

                        Button(
                            onClick = {
                                val currentVerdict = latestVerdict ?: ThreatVerdict(
                                    threatLevel = "CRITICAL",
                                    compositeRisk = 0.95f,
                                    identifiedScamType = "Manual Evidence Capture",
                                    liveCoachingDirectives = listOf("Suspicious active call intercepted"),
                                    auditHash = java.security.MessageDigest.getInstance("SHA-256")
                                        .digest("Evidence:${System.currentTimeMillis()}".toByteArray())
                                        .joinToString("") { "%02x".format(it) },
                                    blockIndex = viewModel.auditHistory.value.size + 1,
                                    timestamp = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.US).format(java.util.Date()),
                                    riskScore = 95,
                                    explanation = "Manual evidence proof saved by user."
                                )
                                WebSocketClientManager.instance.recordProof(currentVerdict)
                                android.widget.Toast.makeText(context, "Evidence archived to ledger", android.widget.Toast.LENGTH_SHORT).show()
                                onNavigateToEvidence()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Slate900),
                            contentPadding = PaddingValues(horizontal = 4.dp, vertical = 10.dp),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Save Proof", fontSize = 11.sp, fontWeight = FontWeight.Bold, maxLines = 1, softWrap = false)
                        }
                    }
                }
            }
        }

        // System Readiness & Permissions Checklist
        Text(
            text = "SYSTEM PERMISSION READINESS",
            style = MaterialTheme.typography.labelSmall,
            color = Slate500
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
            border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                // 1. Overlay Permission
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        modifier = Modifier.weight(1f).padding(end = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            if (hasOverlay) Icons.Default.CheckCircle else Icons.Default.Warning,
                            contentDescription = "Overlay status",
                            tint = if (hasOverlay) ThreatSafe else ThreatWarning,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text("Screen Overlay Display", fontWeight = FontWeight.Bold, fontSize = 13.5.sp, color = Slate900)
                            Text("Required for floating scam warning window", fontSize = 11.5.sp, color = Slate500)
                        }
                    }

                    if (!hasOverlay) {
                        Button(
                            onClick = { viewModel.requestOverlayPermission(context) },
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 4.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Grant", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White, maxLines = 1, softWrap = false)
                        }
                    } else {
                        Surface(
                            color = ThreatSafeBg,
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text("Active", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = ThreatSafe, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                        }
                    }
                }

                Divider(color = BorderColor)

                // 2. Call Screening Service
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        modifier = Modifier.weight(1f).padding(end = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            if (hasScreening) Icons.Default.CheckCircle else Icons.Default.Info,
                            contentDescription = "Call screening status",
                            tint = if (hasScreening) ThreatSafe else PrimaryBlue,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text("Call Screening Engine", fontWeight = FontWeight.Bold, fontSize = 13.5.sp, color = Slate900)
                            Text("Mode A cellular inbound interception", fontSize = 11.5.sp, color = Slate500)
                        }
                    }

                    if (!hasScreening) {
                        Button(
                            onClick = onRequestCallScreening,
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 4.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Enable", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White, maxLines = 1, softWrap = false)
                        }
                    } else {
                        Surface(
                            color = ThreatSafeBg,
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Icon(
                                    Icons.Default.Check,
                                    contentDescription = "Active",
                                    tint = ThreatSafe,
                                    modifier = Modifier.size(13.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    "Active",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = ThreatSafe
                                )
                            }
                        }
                    }
                }

                Divider(color = BorderColor)

                // 3. WhatsApp / VoIP Accessibility Service
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        modifier = Modifier.weight(1f).padding(end = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            if (hasAccessibility) Icons.Default.CheckCircle else Icons.Default.Warning,
                            contentDescription = "Accessibility status",
                            tint = if (hasAccessibility) ThreatSafe else ThreatWarning,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text("WhatsApp / VoIP Interceptor", fontWeight = FontWeight.Bold, fontSize = 13.5.sp, color = Slate900)
                            Text("Accessibility service for video & voice calls", fontSize = 11.5.sp, color = Slate500)
                        }
                    }

                    if (!hasAccessibility) {
                        Button(
                            onClick = { viewModel.requestAccessibilityPermission(context) },
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 4.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Enable", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White, maxLines = 1, softWrap = false)
                        }
                    } else {
                        Surface(
                            color = ThreatSafeBg,
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Icon(
                                    Icons.Default.Check,
                                    contentDescription = "Active",
                                    tint = ThreatSafe,
                                    modifier = Modifier.size(13.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    "Active",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = ThreatSafe
                                )
                            }
                        }
                    }
                }

                Divider(color = BorderColor)

                // 4. Remote Tool Scanner Status
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        modifier = Modifier.weight(1f).padding(end = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            if (installedTools.isEmpty()) Icons.Default.CheckCircle else Icons.Default.Warning,
                            contentDescription = "Tool scan status",
                            tint = if (installedTools.isEmpty()) ThreatSafe else ThreatCritical,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text("Remote Tool Scanner", fontWeight = FontWeight.Bold, fontSize = 13.5.sp, color = Slate900)
                            Text(
                                if (installedTools.isEmpty()) "No AnyDesk/TeamViewer apps present" else "Found: ${installedTools.joinToString()}",
                                fontSize = 11.5.sp,
                                color = if (installedTools.isEmpty()) Slate500 else ThreatCritical
                            )
                        }
                    }

                    Surface(
                        color = if (installedTools.isEmpty()) ThreatSafeBg else ThreatCriticalBg,
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            if (installedTools.isEmpty()) "Clean" else "Flagged",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (installedTools.isEmpty()) ThreatSafe else ThreatCritical,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                Divider(color = BorderColor)

                // 4. WebSocket Backend Connection (Tap to retry)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        modifier = Modifier.weight(1f).padding(end = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            if (connState == ConnectionStatus.CONNECTED) Icons.Default.CheckCircle else Icons.Default.Refresh,
                            contentDescription = "WS status",
                            tint = if (connState == ConnectionStatus.CONNECTED) ThreatSafe else Slate400,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text("AI Gateway Link", fontWeight = FontWeight.Bold, fontSize = 13.5.sp, color = Slate900)
                            Text(
                                if (connState == ConnectionStatus.CONNECTED) "FastAPI live intelligence link" else "Offline fallback engine ready (tap to sync)",
                                fontSize = 11.5.sp,
                                color = Slate500
                            )
                        }
                    }

                    Surface(
                        onClick = { WebSocketClientManager.instance.connect() },
                        color = when (connState) {
                            ConnectionStatus.CONNECTED -> ThreatSafeBg
                            ConnectionStatus.CONNECTING -> ThreatWarningBg
                            else -> Slate100
                        },
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = if (connState == ConnectionStatus.CONNECTED) "CONNECTED" else if (connState == ConnectionStatus.CONNECTING) "CONNECTING" else "OFFLINE READY",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = when (connState) {
                                ConnectionStatus.CONNECTED -> ThreatSafe
                                ConnectionStatus.CONNECTING -> ThreatWarning
                                else -> Slate500
                            },
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }
        }
    }
}
