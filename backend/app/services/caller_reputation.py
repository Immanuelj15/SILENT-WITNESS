"""
Caller Number Reputation and Risk Tiering Subsystem (Tier 2 & Tier 3 Architecture).

Evaluates incoming caller phone numbers against:
- Known spam/fraud prefix patterns (toll-free spoofing, high-risk VoIP gateways, international premium rate)
- Reputation databases & crowd-sourced fraud reports
- Risk tiers: UNKNOWN_NUMBER, KNOWN_CONTACT, VERIFIED_BUSINESS, SUSPECTED_ROBOCALL
- Generates a pre-call prior risk offset and initial trust score baseline.
"""

from typing import Dict, Any, Optional
import re
from datetime import datetime


class RiskTier:
    KNOWN_CONTACT = "KNOWN_CONTACT"
    VERIFIED_BUSINESS = "VERIFIED_BUSINESS"
    UNKNOWN_NUMBER = "UNKNOWN_NUMBER"
    SUSPECTED_ROBOCALL = "SUSPECTED_ROBOCALL"


# Known verified institutional caller IDs (sample directory)
VERIFIED_BUSINESS_DIRECTORY = {
    "+9118001234": {"entity": "State Bank of India Official Support", "domain": "Banking", "safe_callback": "18001234"},
    "+9118002026161": {"entity": "HDFC Bank Customer Support", "domain": "Banking", "safe_callback": "18002026161"},
    "+9118001080": {"entity": "ICICI Bank Official Helpline", "domain": "Banking", "safe_callback": "18001080"},
    "1930": {"entity": "National Cyber Crime Reporting Helpline", "domain": "Government/Law Enforcement", "safe_callback": "1930"},
    "112": {"entity": "Emergency Response Support System", "domain": "Emergency", "safe_callback": "112"},
}

# Known scam/spoofed prefixes and flagged spam numbers
KNOWN_SPAM_SIGNATURES = [
    r"^\+92",          # International high-frequency fraud prefix in target region
    r"^\+1\(800\)",     # Commonly spoofed generic US toll-free
    r"^\+4470",        # UK personal numbering / call forwarding service (frequent scam vector)
    r"^\+91140\d+",    # Indian telemarketing / auto-dialer prefix series
    r"^\+919876543210", # Known dummy/scam test number
]


class CallerReputationService:
    def __init__(self):
        self.verified_dir = VERIFIED_BUSINESS_DIRECTORY
        self.spam_patterns = [re.compile(p) for p in KNOWN_SPAM_SIGNATURES]

    def evaluate_caller(
        self,
        phone_number: str,
        is_in_contacts: bool = False,
        contact_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculates reputation score, risk tier, prior risk penalty, and baseline trust.
        """
        clean_number = re.sub(r"[\s\-\(\)]", "", phone_number.strip())

        # 1. Check known contact
        if is_in_contacts:
            return {
                "phone_number": clean_number,
                "risk_tier": RiskTier.KNOWN_CONTACT,
                "label": contact_name or "Saved Contact",
                "reputation_score": 95,
                "prior_risk_penalty": 0,
                "baseline_trust_score": 95,
                "is_spoof_risk": False,
                "telecom_carrier": "Verified Local Mobile",
                "threat_flags": [],
                "verified_entity": None,
                "recommendation": "Standard protection active. Account compromise monitoring enabled."
            }

        # 2. Check verified business directory
        if clean_number in self.verified_dir:
            info = self.verified_dir[clean_number]
            return {
                "phone_number": clean_number,
                "risk_tier": RiskTier.VERIFIED_BUSINESS,
                "label": info["entity"],
                "reputation_score": 98,
                "prior_risk_penalty": 0,
                "baseline_trust_score": 98,
                "is_spoof_risk": True,  # High risk of caller ID spoofing by attackers
                "telecom_carrier": "Verified Enterprise SIP Trunk",
                "threat_flags": ["HIGH_SPOOF_RISK_TARGET"],
                "verified_entity": info,
                "recommendation": "Caller ID matches verified enterprise directory. NOTE: Caller ID can be spoofed; monitor for credential/OTP demands."
            }

        # 3. Check known spam / robocall patterns
        is_spam_pattern = any(p.search(clean_number) for p in self.spam_patterns)
        if is_spam_pattern or clean_number.startswith("+140") or clean_number.startswith("140"):
            return {
                "phone_number": clean_number,
                "risk_tier": RiskTier.SUSPECTED_ROBOCALL,
                "label": "Suspected Telemarketing / Autodialer / High-Risk VoIP",
                "reputation_score": 25,
                "prior_risk_penalty": 25,
                "baseline_trust_score": 60,
                "is_spoof_risk": True,
                "telecom_carrier": "Unregistered / High-Risk VoIP Gateway",
                "threat_flags": ["SUSPECTED_ROBOCALL", "FLAGGED_PREFIX", "VOIP_SUSPECT"],
                "verified_entity": None,
                "recommendation": "High caution: Number pattern matches recognized telemarketing or spam campaigns."
            }

        # 4. Default: Unknown Number
        return {
            "phone_number": clean_number,
            "risk_tier": RiskTier.UNKNOWN_NUMBER,
            "label": "Unknown Caller",
            "reputation_score": 60,
            "prior_risk_penalty": 10,
            "baseline_trust_score": 80,
            "is_spoof_risk": False,
            "telecom_carrier": "Unknown Carrier",
            "threat_flags": ["UNKNOWN_NUMBER_ELEVATED_BASELINE"],
            "verified_entity": None,
            "recommendation": "Caller not in address book. Elevated baseline scrutiny applied."
        }


caller_reputation_service = CallerReputationService()
