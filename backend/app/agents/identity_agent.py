import re
from typing import Dict, Any, List

class IdentityAgent:
    """
    Identity Agent: Scans for authority/organization identity claims.
    Principle: Claimed Identity != Verified Identity.
    Never assumes caller is who they claim to be.
    """

    IDENTITY_CLAIMS = [
        (r"\b(i am|this is|calling from)\b.*\b(your bank|sbi|hdfc|icici|axis|punjab national|reserve bank|rbi)\b", "Bank Representative", 60.0),
        (r"\b(i am|calling from|this is)\b.*\b(police|cbi|customs officer|narcotics bureau|crime branch|inspector)\b", "Law Enforcement Officer", 80.0),
        (r"\b(i am|calling from)\b.*\b(customer care|support team|tech support|microsoft support|telecom department|trai)\b", "Customer/Tech Support", 50.0),
        (r"\b(i am|calling from)\b.*\b(courier|fedex|dhl|blue dart|amazon delivery)\b", "Courier/Delivery Representative", 40.0),
        (r"\b(i am your son|this is your grandson|i am in trouble mom|dad it's me)\b", "Family Impersonation (Relative)", 75.0),
    ]

    def analyze(self, transcript: str) -> Dict[str, Any]:
        if not transcript or len(transcript.strip()) < 3:
            return {
                "identity_risk_score": 0.0,
                "claimed_identity": None,
                "is_verified": False,
                "confidence": 0.5,
                "proposed_evidence": []
            }

        norm_text = transcript.lower()
        claimed_identities = []
        proposed_evidence = []
        max_risk = 0.0

        for pat, role, base_risk in self.IDENTITY_CLAIMS:
            match = re.search(pat, norm_text)
            if match:
                claimed_identities.append(role)
                max_risk = max(max_risk, base_risk)
                proposed_evidence.append({
                    "phrase": match.group(0),
                    "tag": "Unverified Identity Claim",
                    "note": f"Caller claimed to be: {role} (UNVERIFIED)"
                })

        claimed_role = ", ".join(claimed_identities) if claimed_identities else None

        return {
            "identity_risk_score": round(max_risk, 1),
            "claimed_identity": claimed_role,
            "is_verified": False,  # Always False for inbound voice claims without crypto/carrier auth
            "confidence": 0.85 if claimed_role else 0.70,
            "proposed_evidence": proposed_evidence
        }
