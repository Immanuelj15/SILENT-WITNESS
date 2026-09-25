"""
OTT App-Layer Identity & Reputation Engine.

Replaces telecom caller-ID logic for WhatsApp/Telegram/VoIP OTT calls.
Evaluates app-layer signals: contact status, account age, country code risk,
call origin (broadcast, group, unsolicited), and profile plausibility.

Core principle: No single signal alone triggers high severity.
Country-code risk is soft-weight only — never a sole alarm trigger.
"""

from typing import Dict, Any, Optional, List
import re

# High-risk country codes (statistically elevated scam origin rates — soft signal only)
HIGH_RISK_COUNTRY_CODES = {
    "+234": {"country": "Nigeria", "risk_weight": 0.15},
    "+233": {"country": "Ghana", "risk_weight": 0.12},
    "+1876": {"country": "Jamaica", "risk_weight": 0.12},
    "+1268": {"country": "Antigua", "risk_weight": 0.10},
    "+91": {"country": "India", "risk_weight": 0.04},  # High volume legit + scam; very low soft signal
    "+44": {"country": "UK", "risk_weight": 0.02},
    "+92": {"country": "Pakistan", "risk_weight": 0.08},
    "+880": {"country": "Bangladesh", "risk_weight": 0.07},
    "+977": {"country": "Nepal", "risk_weight": 0.06},
}

# Patterns suggesting a scammer may be using the international call as a cover
SUSPICIOUS_PROFILE_PATTERNS = [
    r"(sbi|hdfc|icici|axis|bank|nabard|rbi|sebi)",  # Bank logos as personal profile names
    r"(police|cbi|ib|customs|narcotic|narcotics bureau)",
    r"(microsoft|apple|amazon|google|flipkart|amazon)",  # Tech giant impersonation
    r"(irdai|trai|mnre|government|govt)\s?(of|india)?",
]

CALL_ORIGIN_RISK_MAP = {
    "BROADCAST": 0.25,       # Received via broadcast list (no personal relationship)
    "FORWARDED_LINK": 0.30,  # Call initiated by clicking a forwarded/unknown link
    "GROUP_ADD": 0.20,       # Added to group by unknown; then called from that context
    "UNSOLICITED_CHAT": 0.18,  # Cold-started with unsolicited message → call
    "KNOWN_CONTACT": -0.10,  # Negative weight — reduces risk
    "SAVED_CONTACT": -0.15,  # Negative weight — strong trust prior
    "DIRECT_DIAL": 0.05,     # Unknown direct dial, neutral but slightly elevated
}


class OTTIdentityEngine:
    """
    Evaluates caller identity from OTT app-layer signals rather than telecom caller-ID.
    Returns a pre-call identity risk score (0–100) and structured signal breakdown.
    """

    def __init__(self):
        self.suspicious_profile_patterns = [
            re.compile(p, re.IGNORECASE) for p in SUSPICIOUS_PROFILE_PATTERNS
        ]

    def analyze_caller(
        self,
        phone_number: Optional[str] = None,
        is_saved_contact: bool = False,
        contact_name: Optional[str] = None,
        account_age_days: Optional[int] = None,
        call_origin: str = "DIRECT_DIAL",
        caller_display_name: Optional[str] = None,
        caller_profile_text: Optional[str] = None,
        user_typical_country_codes: Optional[List[str]] = None,
        is_video_call: bool = False,
        chat_messages_before_call: int = 0,
        has_unsolicited_link_before_call: bool = False,
    ) -> Dict[str, Any]:
        """
        Returns identity risk analysis for an OTT call.

        Args:
            phone_number: Raw phone number string e.g. '+919876543210'
            is_saved_contact: Whether this number is in the user's contacts
            contact_name: Name as stored in user's contacts (if any)
            account_age_days: OTT account creation age in days (if obtainable)
            call_origin: One of BROADCAST, FORWARDED_LINK, GROUP_ADD, UNSOLICITED_CHAT,
                         KNOWN_CONTACT, SAVED_CONTACT, DIRECT_DIAL
            caller_display_name: Name displayed by the calling app
            caller_profile_text: Bio/status text visible on caller profile
            user_typical_country_codes: Country codes the user normally calls/receives from
            is_video_call: Whether this is a video call (extortion risk elevated for unknown video callers)
            chat_messages_before_call: Count of messages in thread before call started
            has_unsolicited_link_before_call: Whether an unverified link was shared before call
        """

        risk_factors = []
        risk_deductions = []
        signal_breakdown = {}
        base_risk = 0.0

        # 1. Saved Contact Status — most important signal
        contact_risk = 0.0
        if is_saved_contact:
            contact_risk = -15.0
            risk_deductions.append("Saved contact: strong prior trust (-15 risk)")
            signal_breakdown["contact_status"] = "SAVED_CONTACT"
        else:
            contact_risk = 20.0
            risk_factors.append("Unsaved/unknown number: elevated OTT scam prior (+20 risk)")
            signal_breakdown["contact_status"] = "UNSAVED_UNKNOWN"
        base_risk += contact_risk

        # 2. Call origin
        origin_weight = CALL_ORIGIN_RISK_MAP.get(call_origin, 0.05)
        origin_risk_points = origin_weight * 100
        base_risk += origin_risk_points
        if origin_risk_points > 0:
            risk_factors.append(f"Call origin: {call_origin} (+{origin_risk_points:.0f} risk)")
        elif origin_risk_points < 0:
            risk_deductions.append(f"Call origin: {call_origin} (trust bonus: {abs(origin_risk_points):.0f})")
        signal_breakdown["call_origin"] = call_origin
        signal_breakdown["call_origin_risk"] = round(origin_risk_points, 1)

        # 3. Account age — very new accounts are suspicious
        account_age_risk = 0.0
        if account_age_days is not None:
            if account_age_days < 7:
                account_age_risk = 25.0
                risk_factors.append("Account created < 7 days ago (burner/fresh account: +25 risk)")
            elif account_age_days < 30:
                account_age_risk = 15.0
                risk_factors.append("Account created < 30 days ago (new account: +15 risk)")
            elif account_age_days < 90:
                account_age_risk = 5.0
                risk_factors.append("Account created < 90 days ago (recent: +5 risk)")
            else:
                account_age_risk = 0.0
                risk_deductions.append(f"Established account ({account_age_days} days old): no age penalty")
        signal_breakdown["account_age_days"] = account_age_days
        signal_breakdown["account_age_risk"] = round(account_age_risk, 1)
        base_risk += account_age_risk

        # 4. Country code (soft signal only — never sole trigger)
        country_code_risk = 0.0
        detected_country = None
        if phone_number:
            for code, info in HIGH_RISK_COUNTRY_CODES.items():
                if phone_number.startswith(code):
                    detected_country = info["country"]
                    # Only apply if NOT in user's typical codes
                    typical = user_typical_country_codes or []
                    if code not in typical:
                        country_code_risk = info["risk_weight"] * 100
                        risk_factors.append(
                            f"Unfamiliar country code {code} ({detected_country}): soft signal "
                            f"(+{country_code_risk:.0f} risk). Alone, never a block trigger."
                        )
                    else:
                        risk_deductions.append(f"Country code {code} ({detected_country}) is in user's typical contact geography — no penalty")
                    break
        signal_breakdown["country_code_risk"] = round(country_code_risk, 1)
        signal_breakdown["detected_country"] = detected_country
        base_risk += country_code_risk

        # 5. Suspicious profile display name / bio
        profile_risk = 0.0
        profile_flags = []
        for pat in self.suspicious_profile_patterns:
            check_str = f"{caller_display_name or ''} {caller_profile_text or ''}"
            if pat.search(check_str):
                profile_flags.append(pat.pattern)
                profile_risk = max(profile_risk, 15.0)

        if profile_flags:
            risk_factors.append(f"Caller display name/bio mimics official institution: +{profile_risk:.0f} risk")
        signal_breakdown["profile_risk"] = round(profile_risk, 1)
        signal_breakdown["profile_flags"] = profile_flags
        base_risk += profile_risk

        # 6. Video call from unsaved number — extortion risk flag
        video_extortion_risk = 0.0
        if is_video_call and not is_saved_contact:
            video_extortion_risk = 15.0
            risk_factors.append("Video call from unsaved contact: extortion pattern risk (+15 risk)")
        signal_breakdown["video_extortion_risk_bonus"] = round(video_extortion_risk, 1)
        base_risk += video_extortion_risk

        # 7. Chat-to-call funnel signals
        chat_funnel_risk = 0.0
        if has_unsolicited_link_before_call:
            chat_funnel_risk += 20.0
            risk_factors.append("Unsolicited/suspicious link shared before this call (+20 risk)")
        if chat_messages_before_call == 0 and not is_saved_contact:
            chat_funnel_risk += 5.0
            risk_factors.append("Cold call — no prior chat context from this number (+5 risk)")
        signal_breakdown["chat_funnel_risk"] = round(chat_funnel_risk, 1)
        base_risk += chat_funnel_risk

        # Clamp to 0–100
        final_risk = max(0.0, min(100.0, base_risk))

        # Determine risk tier
        if final_risk >= 70:
            risk_tier = "HIGH"
            tier_label = "HIGH PRE-CALL RISK"
        elif final_risk >= 40:
            risk_tier = "MEDIUM"
            tier_label = "ELEVATED — STAY CAUTIOUS"
        elif final_risk >= 20:
            risk_tier = "LOW"
            tier_label = "SLIGHTLY ELEVATED — VERIFY IDENTITY"
        else:
            risk_tier = "MINIMAL"
            tier_label = "NORMAL — PROCEED WITH STANDARD AWARENESS"

        return {
            "identity_risk_score": round(final_risk, 1),
            "risk_tier": risk_tier,
            "tier_label": tier_label,
            "is_saved_contact": is_saved_contact,
            "contact_name": contact_name,
            "call_origin": call_origin,
            "detected_country": detected_country,
            "account_age_days": account_age_days,
            "risk_factors": risk_factors,
            "risk_deductions": risk_deductions,
            "signal_breakdown": signal_breakdown,
            "honesty_note": (
                "Country code and unfamiliar number signals are soft indicators only. "
                "Many legitimate international family and business calls trigger these. "
                "High severity requires multiple converging risk signals."
            )
        }


ott_identity_engine = OTTIdentityEngine()
