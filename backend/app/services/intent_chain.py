"""
Scam Intent Chain Engine
Constructs and validates the multi-stage psychological attack progression of scam dialogues.
Stages:
  1. IDENTITY_CLAIM
  2. AUTHORITY_ESTABLISHMENT
  3. URGENCY
  4. FEAR_PRESSURE
  5. SENSITIVE_INFO_REQUEST (Credentials / OTP / PIN)
  6. PAYMENT_REQUEST
  7. ISOLATION
  8. POTENTIAL_VICTIM_ACTION
"""

from typing import List, Dict, Any, Optional
import uuid
import re

STAGE_DEFINITIONS = {
    "IDENTITY_CLAIM": {
        "title": "Identity Claim",
        "description": "Caller establishes a persona or claims affiliation with an organization.",
        "order": 1,
        "base_severity": "LOW"
    },
    "AUTHORITY_ESTABLISHMENT": {
        "title": "Authority Establishment",
        "description": "Caller invokes official power, legal titles, police, or regulatory departments.",
        "order": 2,
        "base_severity": "MEDIUM"
    },
    "URGENCY": {
        "title": "Artificial Urgency",
        "description": "Imposes strict deadlines or sudden emergencies to bypass logical thinking.",
        "order": 3,
        "base_severity": "HIGH"
    },
    "FEAR_PRESSURE": {
        "title": "Fear & Intimidation",
        "description": "Threatens account suspension, arrest, criminal proceedings, or asset freezing.",
        "order": 4,
        "base_severity": "HIGH"
    },
    "SENSITIVE_INFO_REQUEST": {
        "title": "Credential Solicitation",
        "description": "Requests OTP, PIN, netbanking password, CVV, or identity documents.",
        "order": 5,
        "base_severity": "CRITICAL"
    },
    "PAYMENT_REQUEST": {
        "title": "Payment Demand",
        "description": "Directs victim to transfer funds, scan UPI QR, or deposit into 'safe reserve'.",
        "order": 6,
        "base_severity": "CRITICAL"
    },
    "ISOLATION": {
        "title": "Victim Isolation",
        "description": "Instructs victim not to disconnect, not to tell family members, or to maintain secrecy.",
        "order": 7,
        "base_severity": "CRITICAL"
    },
    "POTENTIAL_VICTIM_ACTION": {
        "title": "Victim Action / Compliance",
        "description": "Victim complies, reads out OTP, transfers money, or installs remote tool.",
        "order": 8,
        "base_severity": "CRITICAL"
    }
}

class ScamIntentChainEngine:
    def __init__(self):
        pass

    def build_intent_chain(
        self,
        transcript: str,
        dialogue_turns: Optional[List[Dict[str, Any]]] = None,
        evidence_items: Optional[List[Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyzes the conversation transcript or dialogue turns and constructs
        a sequential Scam Intent Chain with timestamps, evidence quotes, and confidence.
        """
        chain_id = f"CHAIN-{uuid.uuid4().hex[:8].upper()}"
        stages: List[Dict[str, Any]] = []
        detected_stage_keys = set()

        text_lower = transcript.lower()

        # Helper to search evidence with timestamps
        def find_turn_evidence(keywords: List[str], stage_name: str) -> Optional[Dict[str, Any]]:
            if dialogue_turns:
                for turn in dialogue_turns:
                    t_text = turn.get("text", "")
                    speaker = turn.get("speaker", "CALLER")
                    if speaker == "CALLER" or speaker == "UNKNOWN":
                        for kw in keywords:
                            if kw.lower() in t_text.lower():
                                return {
                                    "timestamp": turn.get("timestamp_sec", 0),
                                    "evidence": [t_text.strip()],
                                    "speaker": speaker
                                }
            # Fallback regex on raw text
            for kw in keywords:
                idx = text_lower.find(kw.lower())
                if idx != -1:
                    # Extract surrounding sentence
                    start = max(0, text_lower.rfind(".", 0, idx) + 1)
                    end = text_lower.find(".", idx)
                    if end == -1:
                        end = len(transcript)
                    snippet = transcript[start:end].strip()
                    approx_time = max(5, int((idx / max(len(text_lower), 1)) * 90))
                    return {
                        "timestamp": approx_time,
                        "evidence": [snippet if snippet else kw],
                        "speaker": "CALLER"
                    }
            return None

        # 1. Identity Claim
        id_keywords = ["calling from", "i am from", "speaking from", "department of", "police department", "customs office", "courier team", "helpdesk"]
        match_id = find_turn_evidence(id_keywords, "IDENTITY_CLAIM")
        if match_id:
            detected_stage_keys.add("IDENTITY_CLAIM")
            stages.append({
                "stage": "IDENTITY_CLAIM",
                "title": STAGE_DEFINITIONS["IDENTITY_CLAIM"]["title"],
                "description": STAGE_DEFINITIONS["IDENTITY_CLAIM"]["description"],
                "timestamp": match_id["timestamp"],
                "evidence": match_id["evidence"],
                "confidence": 0.92,
                "severity": STAGE_DEFINITIONS["IDENTITY_CLAIM"]["base_severity"],
                "status": "SUPPORTED"
            })

        # 2. Authority Establishment
        auth_keywords = ["official investigation", "cbi officer", "inspector", "regulatory authority", "head office", "cyber cell", "fraud monitoring unit"]
        match_auth = find_turn_evidence(auth_keywords, "AUTHORITY_ESTABLISHMENT")
        if match_auth:
            detected_stage_keys.add("AUTHORITY_ESTABLISHMENT")
            stages.append({
                "stage": "AUTHORITY_ESTABLISHMENT",
                "title": STAGE_DEFINITIONS["AUTHORITY_ESTABLISHMENT"]["title"],
                "description": STAGE_DEFINITIONS["AUTHORITY_ESTABLISHMENT"]["description"],
                "timestamp": match_auth["timestamp"],
                "evidence": match_auth["evidence"],
                "confidence": 0.89,
                "severity": STAGE_DEFINITIONS["AUTHORITY_ESTABLISHMENT"]["base_severity"],
                "status": "SUPPORTED"
            })

        # 3. Urgency
        urg_keywords = ["immediately", "within 10 minutes", "right now", "expire today", "urgent", "don't delay", "immediate-ah", "turant", "without delay"]
        match_urg = find_turn_evidence(urg_keywords, "URGENCY")
        if match_urg:
            detected_stage_keys.add("URGENCY")
            stages.append({
                "stage": "URGENCY",
                "title": STAGE_DEFINITIONS["URGENCY"]["title"],
                "description": STAGE_DEFINITIONS["URGENCY"]["description"],
                "timestamp": match_urg["timestamp"],
                "evidence": match_urg["evidence"],
                "confidence": 0.95,
                "severity": STAGE_DEFINITIONS["URGENCY"]["base_severity"],
                "status": "SUPPORTED"
            })

        # 4. Fear / Pressure
        fear_keywords = ["account will be blocked", "arrest warrant", "digital arrest", "police action", "court summons", "suspended", "penalties", "frozen", "block aagidum"]
        match_fear = find_turn_evidence(fear_keywords, "FEAR_PRESSURE")
        if match_fear:
            detected_stage_keys.add("FEAR_PRESSURE")
            stages.append({
                "stage": "FEAR_PRESSURE",
                "title": STAGE_DEFINITIONS["FEAR_PRESSURE"]["title"],
                "description": STAGE_DEFINITIONS["FEAR_PRESSURE"]["description"],
                "timestamp": match_fear["timestamp"],
                "evidence": match_fear["evidence"],
                "confidence": 0.94,
                "severity": STAGE_DEFINITIONS["FEAR_PRESSURE"]["base_severity"],
                "status": "SUPPORTED"
            })

        # 5. Sensitive Information Request (Credentials / OTP)
        sens_keywords = ["otp", "one time password", "six-digit", "pin number", "cvv", "password", "netbanking credentials", "card number"]
        match_sens = find_turn_evidence(sens_keywords, "SENSITIVE_INFO_REQUEST")
        if match_sens:
            detected_stage_keys.add("SENSITIVE_INFO_REQUEST")
            stages.append({
                "stage": "SENSITIVE_INFO_REQUEST",
                "title": STAGE_DEFINITIONS["SENSITIVE_INFO_REQUEST"]["title"],
                "description": STAGE_DEFINITIONS["SENSITIVE_INFO_REQUEST"]["description"],
                "timestamp": match_sens["timestamp"],
                "evidence": match_sens["evidence"],
                "confidence": 0.98,
                "severity": STAGE_DEFINITIONS["SENSITIVE_INFO_REQUEST"]["base_severity"],
                "status": "SUPPORTED"
            })

        # 6. Payment Request
        pay_keywords = ["transfer money", "send money", "upi payment", "deposit", "verification fee", "clearing fee", "scan the qr", "pay rupees", "send to safe account"]
        match_pay = find_turn_evidence(pay_keywords, "PAYMENT_REQUEST")
        if match_pay:
            detected_stage_keys.add("PAYMENT_REQUEST")
            stages.append({
                "stage": "PAYMENT_REQUEST",
                "title": STAGE_DEFINITIONS["PAYMENT_REQUEST"]["title"],
                "description": STAGE_DEFINITIONS["PAYMENT_REQUEST"]["description"],
                "timestamp": match_pay["timestamp"],
                "evidence": match_pay["evidence"],
                "confidence": 0.96,
                "severity": STAGE_DEFINITIONS["PAYMENT_REQUEST"]["base_severity"],
                "status": "SUPPORTED"
            })

        # 7. Isolation
        iso_keywords = ["do not disconnect", "stay on this call", "don't tell anyone", "confidential line", "don't share with family", "keep this secret"]
        match_iso = find_turn_evidence(iso_keywords, "ISOLATION")
        if match_iso:
            detected_stage_keys.add("ISOLATION")
            stages.append({
                "stage": "ISOLATION",
                "title": STAGE_DEFINITIONS["ISOLATION"]["title"],
                "description": STAGE_DEFINITIONS["ISOLATION"]["description"],
                "timestamp": match_iso["timestamp"],
                "evidence": match_iso["evidence"],
                "confidence": 0.93,
                "severity": STAGE_DEFINITIONS["ISOLATION"]["base_severity"],
                "status": "SUPPORTED"
            })

        # Sort stages chronologically by timestamp
        stages.sort(key=lambda s: s["timestamp"])

        # Determine progression completeness and danger level
        has_credential_or_payment = "SENSITIVE_INFO_REQUEST" in detected_stage_keys or "PAYMENT_REQUEST" in detected_stage_keys
        has_coercion = "URGENCY" in detected_stage_keys or "FEAR_PRESSURE" in detected_stage_keys

        if has_credential_or_payment and has_coercion:
            progression_state = "CRITICAL_HARVESTING_PHASE"
        elif has_credential_or_payment:
            progression_state = "SOLICITATION_PHASE"
        elif has_coercion:
            progression_state = "PRESSURE_BUILDING_PHASE"
        elif len(stages) > 0:
            progression_state = "ESTABLISHMENT_PHASE"
        else:
            progression_state = "NORMAL_CONVERSATION"

        return {
            "chainId": chain_id,
            "stages": stages,
            "totalStagesDetected": len(stages),
            "progressionState": progression_state,
            "isFullAttackChain": len(stages) >= 3 and has_credential_or_payment
        }

intent_chain_engine = ScamIntentChainEngine()
