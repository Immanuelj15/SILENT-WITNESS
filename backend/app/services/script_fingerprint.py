"""
Scam Script Fingerprinting Engine (Tier 3 Architecture).

Performs semantic and lexical signature matching against a structured
library of canonical scam scripts. Identifies the specific scam taxonomy,
detected stage progression, and similarity confidence.
"""

from typing import Dict, List, Any, Optional
import re


SCAM_SCRIPT_TEMPLATES = [
    {
        "id": "SCRIPT_DIGITAL_ARREST",
        "name": "Digital Arrest / Law Enforcement Extortion",
        "category": "DIGITAL_ARREST",
        "keywords": [
            "digital arrest", "customs", "parcel seized", "narcotics", "cbi", "mumbai police",
            "ed", "money laundering", "skype", "video call", "surveillance", "passport", "fedex"
        ],
        "milestones": [
            "Claiming package seized with contraband/drugs",
            "Threatening immediate arrest by central agency",
            "Demanding continuous Skype/video call isolation",
            "Demanding funds transfer to RBI/police 'verification account'"
        ],
        "safe_exit_advice": "Indian law has NO provision for 'digital arrest' or bail over Skype. Hang up immediately and dial 1930."
    },
    {
        "id": "SCRIPT_BANK_KYC_BLOCK",
        "name": "Bank KYC / Account Suspension Threat",
        "category": "BANKING_OTP",
        "keywords": [
            "kyc", "account block", "sbi yono", "pan card", "debit card expire",
            "otp", "update immediately", "netbanking", "branch", "sms link"
        ],
        "milestones": [
            "Alerting that bank account will be frozen in 24 hours",
            "Demanding immediate PAN/Aadhaar re-verification",
            "Soliciting 6-digit OTP received on phone",
            "Requesting debit card CVV/expiry details"
        ],
        "safe_exit_advice": "Banks NEVER ask for OTP, PIN, or CVV to update KYC. Visit your local branch or use the official mobile app."
    },
    {
        "id": "SCRIPT_ELECTRICITY_DISCONNECTION",
        "name": "Urgent Electricity / Utility Bill Disconnection",
        "category": "CUSTOMER_CARE_SCAM",
        "keywords": [
            "electricity bill", "power cut", "disconnection tonight", "officer",
            "consumer number", "previous month", "payment link", "urgent recharge"
        ],
        "milestones": [
            "Claiming electricity will be disconnected tonight at 9:30 PM",
            "Saying previous month's bill update failed in the system",
            "Asking to call an unofficial mobile number or install a helper app",
            "Demanding immediate small payment (e.g. Rs 10) to update status"
        ],
        "safe_exit_advice": "Electricity boards never send disconnection notices via personal mobile numbers. Verify bill on official utility portal."
    },
    {
        "id": "SCRIPT_REMOTE_TECH_SUPPORT",
        "name": "Remote Access / AnyDesk / TeamViewer Scam",
        "category": "REMOTE_ACCESS_SCAM",
        "keywords": [
            "anydesk", "teamviewer", "quicksupport", "rustdesk", "security team",
            "device hacked", "virus", "screen share", "9 digit code", "fix error"
        ],
        "milestones": [
            "Warning that device or bank account has unauthorized logins",
            "Instructing victim to install AnyDesk or QuickSupport from Play Store",
            "Asking victim to read the 9-digit remote control code",
            "Directing victim to open banking app while screen sharing"
        ],
        "safe_exit_advice": "NEVER share an AnyDesk or QuickSupport code. Anyone asking you to install remote desktop software is attempting complete device takeover."
    },
    {
        "id": "SCRIPT_PART_TIME_JOB_TELEGRAM",
        "name": "Part-Time Job / Task / Telegram Rating Scam",
        "category": "JOB_SCAM",
        "keywords": [
            "part time job", "youtube like", "hotel review", "telegram group",
            "daily income", "commission", "task", "prepaid task", "crypto recharge"
        ],
        "milestones": [
            "Offering easy work-from-home income (Rs 2000-5000/day) for rating videos",
            "Paying small real rewards (Rs 150-500) to establish psychological trust",
            "Adding to a Telegram 'VIP group' with paid task requirements",
            "Demanding increasing advance deposits to unlock earned earnings"
        ],
        "safe_exit_advice": "Legitimate employers never ask you to pay money to receive salary or commissions. Refuse further task deposits."
    },
    {
        "id": "SCRIPT_FAMILY_EMERGENCY_ACCIDENT",
        "name": "Grandparent / Relative Medical Emergency / Arrest",
        "category": "FAMILY_EMERGENCY",
        "keywords": [
            "hospital", "accident", "emergency", "police station", "lawyer",
            "bail money", "don't call parents", "urgent surgery", "doctor fee"
        ],
        "milestones": [
            "Caller claims your son/grandson was involved in an accident or arrested",
            "Distressed background voice crying for help (potential voice clone)",
            "Urgent demand for immediate transfer to hospital or lawyer UPI",
            "Strong isolation plea: 'Do not tell his mother/father yet'"
        ],
        "safe_exit_advice": "Pause. Hang up and directly call the family member on their known personal phone or call other relatives to verify."
    }
]


class ScriptFingerprintEngine:
    def __init__(self):
        self.scripts = SCAM_SCRIPT_TEMPLATES

    def match_transcript(self, transcript_turns: List[str]) -> Dict[str, Any]:
        """
        Analyzes the accumulated transcript turns against the canonical script corpus.
        Returns top matched script, similarity confidence (0.0 to 1.0), and detected milestones.
        """
        if not transcript_turns:
            return {
                "matched": False,
                "script_id": None,
                "name": "No Script Match",
                "similarity_score": 0.0,
                "category": None,
                "detected_milestones": [],
                "safe_exit_advice": None
            }

        full_text = " ".join(transcript_turns).lower()
        best_match = None
        highest_score = 0.0

        for script in self.scripts:
            # Keyword matching
            matched_keywords = [kw for kw in script["keywords"] if kw in full_text]
            keyword_ratio = len(matched_keywords) / max(len(script["keywords"]), 1)

            # Milestone matching heuristics
            detected_milestones = []
            for milestone in script["milestones"]:
                m_words = [w.lower() for w in re.findall(r"\w+", milestone) if len(w) > 4]
                overlap = sum(1 for w in m_words if w in full_text)
                if overlap >= 2:
                    detected_milestones.append(milestone)

            milestone_ratio = len(detected_milestones) / len(script["milestones"])

            # Weighted script similarity score
            score = (keyword_ratio * 0.55) + (milestone_ratio * 0.45)
            # Bonus if high keyword concentration
            if len(matched_keywords) >= 3:
                score = min(1.0, score + 0.15)

            if score > highest_score:
                highest_score = score
                best_match = {
                    "script_id": script["id"],
                    "name": script["name"],
                    "category": script["category"],
                    "similarity_score": round(score, 2),
                    "matched_keywords": matched_keywords,
                    "detected_milestones": detected_milestones,
                    "safe_exit_advice": script["safe_exit_advice"]
                }

        is_matched = highest_score >= 0.25 and best_match is not None

        return {
            "matched": is_matched,
            "script_id": best_match["script_id"] if is_matched else None,
            "name": best_match["name"] if is_matched else "Unclassified Conversation Pattern",
            "similarity_score": best_match["similarity_score"] if is_matched else round(highest_score, 2),
            "category": best_match["category"] if is_matched else None,
            "matched_keywords": best_match["matched_keywords"] if is_matched else [],
            "detected_milestones": best_match["detected_milestones"] if is_matched else [],
            "safe_exit_advice": best_match["safe_exit_advice"] if is_matched else None
        }


script_fingerprint_engine = ScriptFingerprintEngine()
