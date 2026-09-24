from enum import Enum
from typing import List, Dict, Any

class ScamCategory(str, Enum):
    BANKING_SCAM = "Banking Scam"
    OTP_SCAM = "OTP Scam"
    UPI_SCAM = "UPI Scam"
    KYC_SCAM = "KYC Scam"
    LOTTERY_PRIZE_SCAM = "Lottery/Prize Scam"
    INVESTMENT_SCAM = "Investment Scam"
    LOAN_SCAM = "Loan Scam"
    JOB_SCAM = "Job Scam"
    DELIVERY_SCAM = "Delivery Scam"
    CUSTOMER_CARE_SCAM = "Customer Care Scam"
    GOVERNMENT_IMPERSONATION = "Government Impersonation"
    POLICE_LEGAL_THREAT = "Police/Legal Threat Scam"
    PHISHING = "Phishing"
    TECH_SUPPORT_SCAM = "Tech Support Scam"
    ROMANCE_SOCIAL_ENG = "Romance/Social Engineering"
    INSURANCE_SCAM = "Insurance Scam"
    TELECOM_SCAM = "Telecom Scam"
    UNKNOWN_SUSPICIOUS = "Unknown/Suspicious"
    LEGITIMATE_CONVERSATION = "Legitimate Conversation"

# Indian Specific Scam Signal Indicators (Contextual, never sole triggers)
INDIAN_SCAM_SIGNALS: Dict[str, Dict[str, Any]] = {
    "DIGITAL_ARREST": {
        "keywords": ["digital arrest", "cbi officer", "cyber crime branch", "customs clearance", "narcotics bureau", "courier parcel confiscated"],
        "category": ScamCategory.POLICE_LEGAL_THREAT,
        "base_threat": 85
    },
    "KYC_BLOCK": {
        "keywords": ["kyc expired", "account block today", "pan link urgent", "sim block within 24 hours", "aadhaar verification fail"],
        "category": ScamCategory.KYC_SCAM,
        "base_threat": 80
    },
    "UPI_REFUND": {
        "keywords": ["scan qr to receive money", "enter pin to get refund", "send 1 rupee to verify", "gpay refund approval", "phonepe cashback claim"],
        "category": ScamCategory.UPI_SCAM,
        "base_threat": 85
    },
    "ELECTRICITY_DISCONNECT": {
        "keywords": ["electricity bill unpaid", "power will be disconnected at 9 pm", "call this electricity officer"],
        "category": ScamCategory.CUSTOMER_CARE_SCAM,
        "base_threat": 75
    },
    "PART_TIME_JOB": {
        "keywords": ["telegram task", "like youtube video earn money", "daily income 3000 to 5000", "rating hotel task"],
        "category": ScamCategory.JOB_SCAM,
        "base_threat": 75
    }
}
