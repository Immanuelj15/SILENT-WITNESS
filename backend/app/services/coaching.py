"""
Real-Time Conversational Coaching Engine (Tier 2 Architecture).

Provides dynamic, context-aware verbal defensive prompts ("What to say right now")
to help the user safely de-escalate, test, or terminate an active scam call
without tipping off the attacker prematurely.
"""

from typing import Dict, List, Any


COACHING_STRATEGIES = {
    "CREDENTIAL_DEMAND": {
        "priority": "CRITICAL",
        "recommended_script": "Say: 'I never share OTPs or passwords over phone. I will handle this directly at the branch.'",
        "rationale": "Forces the caller into a policy check. Real banks applaud this refusal.",
        "trap_question": "Ask: 'Which branch did you say you are calling from, and what is your employee ID?'"
    },
    "AUTHORITY_THREAT": {
        "priority": "HIGH",
        "recommended_script": "Say: 'I am taking note of this case ID. My legal counsel will accompany me to the official police station directly.'",
        "rationale": "Destroys isolation. Scammers rely on private compliance and fear of third-party involvement.",
        "trap_question": "Ask: 'Which police station FIR is this, and what is the station landline number?'"
    },
    "REMOTE_ACCESS": {
        "priority": "CRITICAL",
        "recommended_script": "Say: 'I will not install any remote software. I am taking this phone to an authorized service center.'",
        "rationale": "Prevents screen-sharing takeover instantly.",
        "trap_question": "Ask: 'What official ticketing portal can I log in to verify this work order?'"
    },
    "URGENT_PAYMENT": {
        "priority": "HIGH",
        "recommended_script": "Say: 'I cannot transfer funds right now. Send me an official paper invoice to my registered address.'",
        "rationale": "Stalls urgency deadlines and refuses instant UPI/crypto payouts.",
        "trap_question": "Ask: 'What is the registered company CIN/GSTIN for this payment?'"
    },
    "FAMILY_EMERGENCY": {
        "priority": "HIGH",
        "recommended_script": "Say: 'I need to check with another family member right now. I will call you back in five minutes.'",
        "rationale": "Breaks the psychological shock and gives time to dial the relative directly.",
        "trap_question": "Ask: 'What is his middle name or his pet's name?' (Pre-shared family secret word)"
    },
    "DEFAULT_MONITOR": {
        "priority": "LOW",
        "recommended_script": "Listen carefully. Do not volunteer any personal information that the caller has not already verified.",
        "rationale": "Maintains situational awareness without escalating.",
        "trap_question": "Ask: 'Could you please confirm what this call is regarding in writing?'"
    }
}


class CoachingEngine:
    def get_coaching_prompt(
        self,
        intent_type: str,
        risk_level: str,
        scam_category: str = None
    ) -> Dict[str, Any]:
        """
        Generates tactical coaching prompts tailored to the active threat state.
        """
        intent = (intent_type or "").upper()
        category = (scam_category or "").upper()

        if "CREDENTIAL" in intent or "OTP" in intent or "BANKING" in category:
            strategy = COACHING_STRATEGIES["CREDENTIAL_DEMAND"]
        elif "THREAT" in intent or "DIGITAL_ARREST" in category or "POLICE" in category:
            strategy = COACHING_STRATEGIES["AUTHORITY_THREAT"]
        elif "REMOTE" in category or "ANYDESK" in intent:
            strategy = COACHING_STRATEGIES["REMOTE_ACCESS"]
        elif "PAYMENT" in intent or "UPI" in category or "INVESTMENT" in category:
            strategy = COACHING_STRATEGIES["URGENT_PAYMENT"]
        elif "FAMILY" in category:
            strategy = COACHING_STRATEGIES["FAMILY_EMERGENCY"]
        elif risk_level in ["HIGH_RISK", "CRITICAL"]:
            strategy = COACHING_STRATEGIES["CREDENTIAL_DEMAND"]
        else:
            strategy = COACHING_STRATEGIES["DEFAULT_MONITOR"]

        return {
            "priority": strategy["priority"],
            "recommended_script": strategy["recommended_script"],
            "rationale": strategy["rationale"],
            "trap_question": strategy["trap_question"],
            "immediate_action": "Do not share OTP/PIN. Never grant remote access." if strategy["priority"] == "CRITICAL" else "Stay calm."
        }


coaching_engine = CoachingEngine()
