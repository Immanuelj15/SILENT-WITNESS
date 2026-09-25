from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class CallerIdentityReport(BaseModel):
    claimed_name: Optional[str] = None
    claimed_organization: Optional[str] = None
    claimed_role: Optional[str] = None
    verification_status: str  # "CLAIMED", "UNVERIFIED", "PARTIALLY_VERIFIED", "VERIFIED", "CONTRADICTED", "UNKNOWN"
    verification_method: str = "CONVERSATIONAL_BEHAVIORAL_AUDIT"
    verification_confidence: float = 0.85
    contradictions: List[str] = []
    official_directory_contact: Optional[str] = None
    recommended_action: str

# Directory of verified official public contacts
OFFICIAL_ORGANIZATION_DIRECTORY: Dict[str, Dict[str, str]] = {
    "STATE BANK OF INDIA": {"official_phone": "1800 1234 / 1800 2100", "domain": "sbi.co.in", "policy": "Never asks for OTP, PIN, CVV or password by phone."},
    "HDFC BANK": {"official_phone": "1800 202 6161", "domain": "hdfcbank.com", "policy": "Bank representatives NEVER ask for OTP or Netbanking credentials."},
    "ICICI BANK": {"official_phone": "1800 1080", "domain": "icicibank.com", "policy": "Never requests sensitive credentials or AnyDesk screen sharing."},
    "RESERVE BANK OF INDIA": {"official_phone": "14440", "domain": "rbi.org.in", "policy": "RBI never holds public accounts or demands fund transfers for verification."},
    "CYBER CRIME HELPLINE": {"official_phone": "1930", "domain": "cybercrime.gov.in", "policy": "Official national cybercrime reporting portal and helpline."},
    "NATIONAL POLICE EMERGENCY": {"official_phone": "112", "domain": "police.gov.in", "policy": "Police never conduct digital arrests or demand fines via UPI."},
    "BLUE DART": {"official_phone": "1860 233 1234", "domain": "bluedart.com", "policy": "Does not solicit OTPs or payment via unverified phone links."},
    "AMAZON": {"official_phone": "1800 3000 9009", "domain": "amazon.in", "policy": "Never calls to request remote access tools for refunds."}
}

class IdentityVerifierService:
    """
    Caller Identity Verification Subsystem (Sections 11, 17, 18, 55).
    Maintains separation: Claimed Identity != Verified Identity.
    Cross-checks behavioral demands against institutional policies.
    """

    @classmethod
    def verify_caller_identity(
        cls,
        claimed_identity_raw: Optional[str],
        observed_demands: List[str],
        has_urgency: bool = False
    ) -> CallerIdentityReport:
        if not claimed_identity_raw:
            return CallerIdentityReport(
                claimed_name=None,
                claimed_organization=None,
                claimed_role=None,
                verification_status="UNKNOWN",
                verification_confidence=0.5,
                contradictions=[],
                official_directory_contact=None,
                recommended_action="Continue monitoring. Be cautious if caller requests personal data."
            )

        norm_claimed = claimed_identity_raw.upper()
        matched_org_key = None
        matched_org_info = None

        for org_key, org_info in OFFICIAL_ORGANIZATION_DIRECTORY.items():
            if org_key in norm_claimed or any(part in norm_claimed for part in org_key.split()):
                matched_org_key = org_key
                matched_org_info = org_info
                break

        contradictions: List[str] = []
        has_credential_demand = any("otp" in d.lower() or "pin" in d.lower() or "password" in d.lower() or "credential" in d.lower() for d in observed_demands)
        has_remote_access = any("anydesk" in d.lower() or "teamviewer" in d.lower() or "remote" in d.lower() for d in observed_demands)

        # Behavioral Contradiction Detection
        if matched_org_info and has_credential_demand:
            contradictions.append(
                f"Contradiction: Caller claims to represent '{matched_org_key}', but requested a credential. {matched_org_info['policy']}"
            )
        if matched_org_info and has_remote_access:
            contradictions.append(
                f"Contradiction: Official {matched_org_key} policies strictly forbid requesting remote access software."
            )
        if "POLICE" in norm_claimed and has_credential_demand:
            contradictions.append(
                "Contradiction: Law enforcement never demands bank credentials or payment via phone."
            )

        # Compute Verification Status
        if len(contradictions) > 0:
            status = "CONTRADICTED"
            confidence = 0.96
            action = f"🚨 CONTRADICTION DETECTED: Caller claims to be {claimed_identity_raw}, but their behavior violates official policies. Hang up immediately."
        else:
            status = "UNVERIFIED"
            confidence = 0.88
            action = f"Caller identity is NOT verified. Do not trust inbound authority claims. Verify by calling official contact {matched_org_info['official_phone'] if matched_org_info else 'listed on the organization website'}."

        return CallerIdentityReport(
            claimed_name=None,
            claimed_organization=matched_org_key or claimed_identity_raw,
            claimed_role=claimed_identity_raw,
            verification_status=status,
            verification_method="BEHAVIORAL_POLICY_CONTRADICTION_ANALYSIS",
            verification_confidence=confidence,
            contradictions=contradictions,
            official_directory_contact=matched_org_info["official_phone"] if matched_org_info else None,
            recommended_action=action
        )

    def verify_caller_claim(
        self,
        claimed_name: Optional[str] = None,
        claimed_org: Optional[str] = None,
        caller_phone: Optional[str] = None,
        transcript: str = ""
    ) -> Dict[str, Any]:
        """
        Wrapper providing dictionary representation and risk contribution.
        """
        combined_claim = claimed_name or claimed_org
        # extract any demands from transcript
        t_lower = transcript.lower()
        observed_demands = []
        if "otp" in t_lower or "password" in t_lower or "pin" in t_lower:
            observed_demands.append("credential")
        if "anydesk" in t_lower or "teamviewer" in t_lower or "remote" in t_lower:
            observed_demands.append("remote_access")
        if "transfer" in t_lower or "send money" in t_lower or "upi" in t_lower:
            observed_demands.append("payment")

        report = self.verify_caller_identity(
            claimed_identity_raw=combined_claim,
            observed_demands=observed_demands
        )

        risk_score = 0.0
        if report.verification_status == "CONTRADICTED":
            risk_score = 90.0
        elif report.verification_status == "UNVERIFIED" and combined_claim:
            risk_score = 65.0
        elif report.verification_status == "UNKNOWN":
            risk_score = 30.0

        return {
            "claimedName": claimed_name,
            "claimedOrganization": report.claimed_organization,
            "claimedRole": report.claimed_role,
            "verificationStatus": report.verification_status,
            "verificationConfidence": report.verification_confidence,
            "contradictions": report.contradictions,
            "officialDirectoryContact": report.official_directory_contact,
            "recommendedAction": report.recommended_action,
            "riskScore": risk_score
        }

caller_identity_verifier = IdentityVerifierService()
