package com.silentwitness.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.silentwitness.ui.GuardianViewModel
import com.silentwitness.ui.theme.*

@Composable
fun EvidenceHistoryScreen(
    viewModel: GuardianViewModel,
    modifier: Modifier = Modifier
) {
    val auditHistory by viewModel.auditHistory.collectAsState()

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Cryptographic Evidence Ledger",
                        style = MaterialTheme.typography.headlineMedium,
                        color = Slate900
                    )
                    Text(
                        text = "Immutable SHA-256 Merkle-linked audit trail of screened telephony events.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Slate500,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }

                if (auditHistory.isNotEmpty()) {
                    IconButton(onClick = { viewModel.clearAuditHistory() }) {
                        Icon(Icons.Default.Delete, contentDescription = "Clear", tint = Slate400)
                    }
                }
            }
        }

        if (auditHistory.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.Lock,
                            contentDescription = "Empty",
                            tint = Slate400,
                            modifier = Modifier.size(36.dp)
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "No Screened Records Yet",
                            style = MaterialTheme.typography.titleMedium,
                            color = Slate900
                        )
                        Text(
                            text = "Incoming phone calls and test dialogues from the Scam Lab will automatically generate cryptographically chained Merkle blocks here.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Slate500,
                            modifier = Modifier.padding(top = 4.dp),
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                }
            }
        } else {
            items(auditHistory) { record ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderColor),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "BLOCK #${record.blockIndex}",
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 12.sp,
                                    color = PrimaryBlue
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = record.timestamp.take(19).replace("T", " "),
                                    fontSize = 11.sp,
                                    color = Slate400
                                )
                            }

                            val badgeColor = when (record.threatLevel) {
                                "CRITICAL" -> ThreatCritical
                                "HIGH" -> ThreatWarning
                                else -> ThreatSafe
                            }
                            val badgeBg = when (record.threatLevel) {
                                "CRITICAL" -> ThreatCriticalBg
                                "HIGH" -> ThreatWarningBg
                                else -> ThreatSafeBg
                            }

                            Surface(
                                color = badgeBg,
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(
                                    text = record.threatLevel,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = badgeColor
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = record.identifiedScamType,
                            style = MaterialTheme.typography.titleMedium,
                            color = Slate900
                        )

                        if (record.maskedTranscript.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Transcript: \"${record.maskedTranscript}\"",
                                style = MaterialTheme.typography.bodyMedium,
                                color = Slate700
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Surface(
                            color = Slate100,
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "SHA-256 HASH: ",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Slate500
                                )
                                Text(
                                    text = record.auditHash,
                                    fontSize = 10.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = Slate900,
                                    maxLines = 1
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
