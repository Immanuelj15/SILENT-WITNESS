package com.silentwitness.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Warning
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
import com.silentwitness.ui.GuardianViewModel
import com.silentwitness.ui.theme.*

@Composable
fun ScamLabScreen(
    viewModel: GuardianViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var inputText by remember { mutableStateOf("") }
    val latestVerdict by viewModel.latestVerdict.collectAsState()

    val testPresets = listOf(
        "Digital Arrest Threat" to "This is Mumbai Police Cyber Crime Cell. A courier seized in your name contained narcotics. You are under immediate digital arrest.",
        "Bank KYC OTP Scam" to "Hello sir, calling from SBI fraud security. Your debit card is blocked. Share the 6 digit OTP immediately to reactivate it.",
        "AnyDesk Remote Access" to "Please download AnyDesk or TeamViewer from Play Store and read me the 9-digit code so I can fix your server error.",
        "Legitimate Delivery" to "Hello, this is Blue Dart courier. I have an express document delivery for your address. Are you available to sign?"
    )

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Interactive Scam Lab",
                style = MaterialTheme.typography.headlineMedium,
                color = Slate900
            )
            Text(
                text = "Inject real-world attack scripts into the local AI engine to test detection, response latency, and overlay defense without needing a live phone line.",
                style = MaterialTheme.typography.bodyMedium,
                color = Slate500,
                modifier = Modifier.padding(top = 4.dp)
            )
        }

        // Live Threat Status Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "AI DEFENSE GAUGE",
                            style = MaterialTheme.typography.labelSmall,
                            color = Slate400
                        )

                        val badgeColor = when (latestVerdict?.threatLevel) {
                            "CRITICAL" -> ThreatCritical
                            "HIGH" -> ThreatWarning
                            else -> ThreatSafe
                        }
                        val badgeBg = when (latestVerdict?.threatLevel) {
                            "CRITICAL" -> ThreatCriticalBg
                            "HIGH" -> ThreatWarningBg
                            else -> ThreatSafeBg
                        }

                        Surface(
                            color = badgeBg,
                            shape = RoundedCornerShape(20.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, badgeColor.copy(alpha = 0.5f))
                        ) {
                            Text(
                                text = latestVerdict?.threatLevel ?: "STANDBY",
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = badgeColor
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = latestVerdict?.identifiedScamType ?: "No Dialogue Tested Yet",
                        style = MaterialTheme.typography.titleLarge,
                        color = Slate900
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = latestVerdict?.explanation
                            ?: "Send a speech snippet or tap a 1-click test scenario below to evaluate the multi-agent detection engine.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Slate700
                    )

                    if (!latestVerdict?.liveCoachingDirectives.isNullOrEmpty()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "LIVE COACHING DIRECTIVES:",
                            style = MaterialTheme.typography.labelSmall,
                            color = PrimaryBlue
                        )
                        latestVerdict?.liveCoachingDirectives?.forEach { directive ->
                            Text(
                                text = "• $directive",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold,
                                color = Slate900,
                                modifier = Modifier.padding(top = 3.dp)
                            )
                        }
                    }
                }
            }
        }

        // Direct Simulation Triggers
        item {
            Text(
                text = "1-Click Attack Scenarios",
                style = MaterialTheme.typography.titleMedium,
                color = Slate900
            )
        }

        items(testPresets.size) { index ->
            val (title, phrase) = testPresets[index]
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = title,
                            style = MaterialTheme.typography.titleMedium,
                            color = Slate900
                        )
                        Text(
                            text = phrase,
                            style = MaterialTheme.typography.bodyMedium,
                            color = Slate500,
                            maxLines = 2,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(10.dp))

                    Button(
                        onClick = {
                            viewModel.sendScamLabSnippet(phrase)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Icon(Icons.Default.PlayArrow, contentDescription = "Test", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Test", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Manual Dialogue Input
        item {
            Text(
                text = "Custom Dialogue Tester",
                style = MaterialTheme.typography.titleMedium,
                color = Slate900,
                modifier = Modifier.padding(top = 8.dp)
            )

            OutlinedTextField(
                value = inputText,
                onValueChange = { inputText = it },
                label = { Text("Spoken dialogue transcript") },
                placeholder = { Text("e.g. Please open WhatsApp and share your screen...") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                shape = RoundedCornerShape(10.dp)
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 10.dp),
                horizontalArrangement = Arrangement.End
            ) {
                Button(
                    onClick = {
                        if (inputText.isNotBlank()) {
                            viewModel.sendScamLabSnippet(inputText)
                            inputText = ""
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.Send, contentDescription = "Send", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Analyze Speech", fontWeight = FontWeight.Bold)
                }
            }
        }

        // Trigger Floating Overlay Button
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = LightBlue),
                border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryBlue.copy(alpha = 0.3f))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "Test Guardian Floating Overlay",
                        style = MaterialTheme.typography.titleMedium,
                        color = PrimaryBlue
                    )
                    Text(
                        text = "Launch the system alert overlay over your screen to experience how high-contrast scam alerts appear during active phone calls.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Slate700,
                        modifier = Modifier.padding(vertical = 6.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = {
                                viewModel.simulateOverlay(context, "OTP")
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Red: OTP Threat", fontSize = 11.sp, color = ThreatCritical, fontWeight = FontWeight.Bold)
                        }

                        OutlinedButton(
                            onClick = {
                                viewModel.simulateOverlay(context, "DIGITAL_ARREST")
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Amber: Police Arrest", fontSize = 11.sp, color = ThreatWarning, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
