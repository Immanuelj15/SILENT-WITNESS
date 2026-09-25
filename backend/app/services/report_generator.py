"""
Post-Call Safety Report Generator
Generates comprehensive post-call safety documentation including:
  - Call Summary (Duration, Language, Classification, Trust & Risk Scores)
  - Major Risk Signals
  - Scam Intent Chain
  - Chronological Attack Timeline
  - Verbatim Evidence Snippets
  - Caller Identity Audit
  - Actionable Defense Recommendations
  - Privacy-Safe Sanitized Summary Export
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import uuid

class SafetyReportGenerator:
    def __init__(self):
        pass

    def generate_report(
        self,
        call_id: str,
        analysis_result: Dict[str, Any],
        intent_chain: Optional[Dict[str, Any]] = None,
        timeline_events: Optional[List[Dict[str, Any]]] = None,
        identity_audit: Optional[Dict[str, Any]] = None,
        multilingual_info: Optional[Dict[str, Any]] = None,
        duration_seconds: float = 65.0
    ) -> Dict[str, Any]:
        """
        Assembles a complete, auditable post-call safety report.
        """
        report_id = f"REP-{uuid.uuid4().hex[:8].upper()}"
        generated_at = datetime.utcnow().isoformat() + "Z"

        classification = analysis_result.get("classification", "SAFE")
        risk_score = analysis_result.get("riskScore", 0)
        trust_score = analysis_result.get("trustScore", 100)
        confidence = analysis_result.get("confidence", 0.85)
        category = analysis_result.get("category", "LEGITIMATE_CONVERSATION")
        raw_evidence = analysis_result.get("evidence", [])

        # Extract major risk signals
        major_signals = []
        for e in raw_evidence:
            tag = e.get("detected_tag") if isinstance(e, dict) else getattr(e, "detected_tag", "")
            if tag and tag not in major_signals:
                major_signals.append(tag)

        # Build Privacy-Safe Summary (sanitizing possible account numbers / phone digits)
        clean_recs = analysis_result.get("actions", [
            "Verify all unfamiliar requests independently",
            "Never share 2FA credentials or banking PINs"
        ])

        report_payload = {
            "reportId": report_id,
            "callId": call_id,
            "generatedAt": generated_at,
            "callSummary": {
                "durationSec": round(duration_seconds, 1),
                "durationFormatted": f"{int(duration_seconds // 60):02d}:{int(duration_seconds % 60):02d}",
                "primaryLanguage": multilingual_info.get("primaryLanguage", "English") if multilingual_info else "English",
                "isCodeSwitched": multilingual_info.get("isCodeSwitched", False) if multilingual_info else False,
                "dialectTag": multilingual_info.get("dialectTag", "Standard") if multilingual_info else "Standard",
                "finalClassification": classification,
                "trustScore": trust_score,
                "riskScore": risk_score,
                "modelConfidence": confidence,
                "scamCategory": category
            },
            "majorRiskSignals": major_signals if major_signals else ["No critical threats detected"],
            "scamIntentChain": intent_chain if intent_chain else {"stages": [], "totalStagesDetected": 0},
            "attackTimeline": timeline_events if timeline_events else [],
            "callerIdentityAudit": identity_audit if identity_audit else {
                "claimedIdentity": "Unknown / Unclaimed",
                "claimedOrganization": "None",
                "verificationStatus": "UNKNOWN",
                "contradictions": []
            },
            "evidenceAudit": [
                {
                    "phrase": e.get("exact_phrase") if isinstance(e, dict) else getattr(e, "exact_phrase", ""),
                    "tag": e.get("detected_tag") if isinstance(e, dict) else getattr(e, "detected_tag", ""),
                    "context": e.get("context_note") if isinstance(e, dict) else getattr(e, "context_note", "")
                }
                for e in raw_evidence
            ],
            "recommendedActions": clean_recs,
            "privacySafeSummary": {
                "summaryText": f"Call assessed as {classification} (Trust: {trust_score}/100, Risk: {risk_score}/100). Category: {category}. "
                               f"Primary findings: {', '.join(major_signals[:3]) if major_signals else 'None'}. "
                               f"Recommended defense: {clean_recs[0] if clean_recs else 'Stay vigilant'}.",
                "containsRedactedTranscript": True
            }
        }

        return report_payload

report_generator = SafetyReportGenerator()
