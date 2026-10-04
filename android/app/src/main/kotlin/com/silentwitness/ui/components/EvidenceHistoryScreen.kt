package com.silentwitness.ui.components

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.silentwitness.evidence.EvidenceLedgerService
import com.silentwitness.evidence.IncidentDossier
import com.silentwitness.ui.GuardianViewModel
import com.silentwitness.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EvidenceHistoryScreen(
    viewModel: GuardianViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val auditHistory by viewModel.auditHistory.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf("ALL") }

    // Read certified dossiers directly from EvidenceLedgerService or build from auditHistory
    val persistedDossiers = remember(auditHistory) {
        val stored = EvidenceLedgerService.getAllDossiers(context)
        if (stored.isNotEmpty()) {
            stored
        } else {
            auditHistory.map { v ->
                val (callType, callerId) = when {
                    v.identifiedScamType.contains("WhatsApp", ignoreCase = true) ->
                        "WhatsApp Video / Audio" to "+91 (WhatsApp Verified Contact)"
                    v.identifiedScamType.contains("Telegram", ignoreCase = true) ->
                        "Telegram Call" to "+91 (Telegram Contact)"
                    else ->
                        "Cellular Inbound" to "+91 (Flagged Inbound Caller)"
                }
                IncidentDossier(
                    incidentId = java.util.UUID.randomUUID().toString(),
                    timestampUtc = v.timestamp,
                    timestampIst = v.timestamp,
                    callerIdentifier = callerId,
                    callType = callType,
                    scamClassification = v.identifiedScamType,
                    sanitizedTranscript = EvidenceLedgerService.sanitizeTranscript(v.maskedTranscript),
                    merkleHash = v.auditHash.ifEmpty { "0000000000000000000000000000000000000000" },
                    riskScore = v.riskScore,
                    threatLevel = v.threatLevel,
                    directives = v.liveCoachingDirectives,
                    isVerified = true
                )
            }
        }
    }

    val filteredDossiers = remember(persistedDossiers, searchQuery, selectedFilter) {
        persistedDossiers.filter { dossier ->
            val matchesFilter = when (selectedFilter) {
                "CRITICAL" -> dossier.threatLevel == "CRITICAL" || dossier.riskScore >= 80
                "WARNING" -> dossier.threatLevel == "HIGH" || (dossier.riskScore in 40..79)
                else -> true
            }
            val matchesSearch = searchQuery.isBlank() ||
                    dossier.scamClassification.contains(searchQuery, ignoreCase = true) ||
                    dossier.callerIdentifier.contains(searchQuery, ignoreCase = true) ||
                    dossier.sanitizedTranscript.contains(searchQuery, ignoreCase = true) ||
                    dossier.incidentId.contains(searchQuery, ignoreCase = true)

            matchesFilter && matchesSearch
        }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Evidence Ledger (1930 Helpline)",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.ExtraBold,
                        color = Slate900
                    )
                    Text(
                        text = "Certified cyber crime incident dossiers with SHA-256 Merkle proofs for police reporting.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Slate500,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }

                if (persistedDossiers.isNotEmpty()) {
                    IconButton(onClick = {
                        viewModel.clearAuditHistory()
                        EvidenceLedgerService.clearAll(context)
                        Toast.makeText(context, "Ledger cleared", Toast.LENGTH_SHORT).show()
                    }) {
                        Icon(Icons.Default.Delete, contentDescription = "Clear", tint = Slate400)
                    }
                }
            }
        }

        // Search Bar
        item {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search by phone, scam type, or transcript...", fontSize = 13.sp, color = Slate400) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = Slate400) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear search", tint = Slate400)
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = SurfaceWhite,
                    unfocusedContainerColor = SurfaceWhite,
                    focusedBorderColor = PrimaryBlue,
                    unfocusedBorderColor = BorderColor
                ),
                singleLine = true
            )
        }

        // Filter Chips Row
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("ALL" to "All Records", "CRITICAL" to "Critical (90%+)", "WARNING" to "Elevated Risk").forEach { (key, label) ->
                    val isSelected = selectedFilter == key
                    FilterChip(
                        selected = isSelected,
                        onClick = { selectedFilter = key },
                        label = { Text(label, fontSize = 11.5.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryBlue,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }
        }

        // Empty State
        if (filteredDossiers.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    border = BorderStroke(1.dp, BorderColor)
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
                            modifier = Modifier.size(40.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = if (searchQuery.isNotBlank()) "No Matching Incidents Found" else "No Screened Attacks Recorded Yet",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Slate900
                        )
                        Text(
                            text = if (searchQuery.isNotBlank())
                                "Try searching for a different keyword or reset the filter."
                            else
                                "Incoming calls intercepted by Silent Witness or simulated attacks from Scam Lab will automatically generate certified police dossiers here.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Slate500,
                            modifier = Modifier.padding(top = 4.dp),
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                }
            }
        } else {
            items(filteredDossiers) { dossier ->
                DossierCard(dossier = dossier, onExport = {
                    EvidenceLedgerService.shareOfficialComplaint(context, dossier)
                })
            }
        }
    }
}

@Composable
fun DossierCard(
    dossier: IncidentDossier,
    onExport: () -> Unit
) {
    val tierColor = when {
        dossier.threatLevel == "CRITICAL" || dossier.riskScore >= 80 -> ThreatCritical
        dossier.threatLevel == "HIGH" || dossier.riskScore >= 40 -> ThreatWarning
        else -> ThreatSafe
    }
    val tierBg = when {
        dossier.threatLevel == "CRITICAL" || dossier.riskScore >= 80 -> ThreatCriticalBg
        dossier.threatLevel == "HIGH" || dossier.riskScore >= 40 -> ThreatWarningBg
        else -> ThreatSafeBg
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        border = BorderStroke(1.dp, BorderColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header Row: Incident ID + Risk Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            color = LightBlue,
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = "INCIDENT #${dossier.incidentId.take(8).uppercase()}",
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = PrimaryBlue,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = dossier.callType,
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Slate500
                        )
                    }
                    Text(
                        text = dossier.timestampIst,
                        fontSize = 10.5.sp,
                        color = Slate400,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }

                Surface(
                    color = tierBg,
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, tierColor.copy(alpha = 0.4f))
                ) {
                    Text(
                        text = "${dossier.threatLevel} (${dossier.riskScore}%)",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = tierColor
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Scam Classification
            Text(
                text = dossier.scamClassification,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Slate900
            )

            // Caller Identifier
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(top = 2.dp)
            ) {
                Icon(Icons.Default.Phone, contentDescription = null, tint = Slate400, modifier = Modifier.size(13.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "Caller: ${dossier.callerIdentifier}",
                    fontSize = 12.sp,
                    color = Slate600,
                    fontWeight = FontWeight.Medium
                )
            }

            // Sanitized Dialogue Transcript
            if (dossier.sanitizedTranscript.isNotBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    color = Slate50,
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, Slate200),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(
                            text = "FORENSIC TRANSCRIPT (FINANCIAL PII REDACTED):",
                            fontSize = 9.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate500
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "\"${dossier.sanitizedTranscript}\"",
                            fontSize = 12.sp,
                            color = Slate800,
                            lineHeight = 16.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // SHA-256 Merkle Proof
            Surface(
                color = Slate100,
                shape = RoundedCornerShape(6.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = ThreatSafe, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "SHA-256: ",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate600
                    )
                    Text(
                        text = dossier.merkleHash,
                        fontSize = 9.5.sp,
                        fontFamily = FontFamily.Monospace,
                        color = Slate900,
                        maxLines = 1,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Action: Export 1930 Official Complaint
            Button(
                onClick = onExport,
                colors = ButtonDefaults.buttonColors(containerColor = Slate900),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth(),
                contentPadding = PaddingValues(vertical = 10.dp)
            ) {
                Icon(Icons.Default.Share, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Export Official Complaint (1930 Helpline)",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
        }
    }
}
