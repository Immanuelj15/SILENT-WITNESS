from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class KnowledgeBaseCategory(BaseModel):
    category_id: str
    name: str
    description: str
    typical_intent: List[str]
    common_signals: List[str]
    known_attack_stages: List[str]
    dangerous_requests: List[str]
    recommended_action: str
    severity: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    version: str = "1.0.0"
    last_updated: str = "2026-09-25"

KNOWLEDGE_BASE_DATA: Dict[str, KnowledgeBaseCategory] = {
    "BANKING_OTP": KnowledgeBaseCategory(
        category_id="BANKING_OTP",
        name="Banking & OTP Scam",
        description="Attackers impersonate bank executives or fraud prevention officers claiming urgent account issues to harvest 2FA OTP codes, passwords, or debit card CVVs.",
        typical_intent=["REQUEST_OTP", "REQUEST_PIN", "REQUEST_PASSWORD", "REQUEST_CARD_DETAILS"],
        common_signals=["Urgent account block threat", "Unsolicited bank caller", "False unauthorized debit notification", "One-time password demand"],
        known_attack_stages=["Identity Claim (Bank)", "Authority Establishment", "Fear/Urgency Creation", "Credential Harvesting"],
        dangerous_requests=["Read out 6-digit SMS OTP", "Confirm netbanking password", "Provide 16-digit debit card number and CVV"],
        recommended_action="Do not share any OTP or PIN. Hang up immediately and call the official bank phone number printed on your debit card.",
        severity="CRITICAL"
    ),
    "UPI_SCAM": KnowledgeBaseCategory(
        category_id="UPI_SCAM",
        name="UPI & QR Inversion Scam",
        description="Scammers trick victims into scanning QR codes or entering their secret UPI MPIN under the false pretense of 'receiving' money, cashback, or refunds.",
        typical_intent=["REQUEST_PIN", "REQUEST_UPI_PAYMENT", "REQUEST_CLICK_LINK"],
        common_signals=["'Scan QR to receive money'", "'Enter PIN to verify refund'", "'Send 1 rupee to test payment'", "Google Pay / PhonePe cashback lure"],
        known_attack_stages=["Lure / Refund Offer", "Reverse Payment Direction", "PIN Solicitation", "Unauthorized Fund Deduction"],
        dangerous_requests=["Enter UPI MPIN on request payment screen", "Scan custom QR code sent via WhatsApp", "Approve payment collect request"],
        recommended_action="Remember: You NEVER need to enter your UPI PIN or scan a QR code to RECEIVE money. Cancel the request immediately.",
        severity="CRITICAL"
    ),
    "KYC_SCAM": KnowledgeBaseCategory(
        category_id="KYC_SCAM",
        name="KYC Expiry / Aadhaar Suspension Scam",
        description="Fraudsters threaten that the victim's SIM card, bank account, or wallet will be blocked within hours due to incomplete or expired KYC.",
        typical_intent=["REQUEST_APP_INSTALLATION", "REQUEST_CLICK_LINK", "REQUEST_PERSONAL_DATA"],
        common_signals=["'KYC will expire today'", "Threat of SIM deactivation within 24 hours", "Download QuickSupport / AnyDesk to update KYC"],
        known_attack_stages=["Service Discontinuation Threat", "False Assistance Offer", "Malicious Link / Remote Access App", "Credential Interception"],
        dangerous_requests=["Click unverified SMS verification link", "Install APK or remote screen sharing app", "Transfer nominal fee to verify KYC"],
        recommended_action="Banks and telecom operators never ask you to install remote access apps for KYC. Visit your official branch or provider app.",
        severity="HIGH"
    ),
    "DIGITAL_ARREST": KnowledgeBaseCategory(
        category_id="DIGITAL_ARREST",
        name="Digital Arrest & Legal Threat Extortion",
        description="Extortionists impersonate police, CBI, ED, or customs officers falsely accusing the victim of parcel seizures containing narcotics or money laundering.",
        typical_intent=["REQUEST_STAY_ON_CALL", "REQUEST_KEEP_SECRET", "REQUEST_BANK_TRANSFER", "REQUEST_PAYMENT"],
        common_signals=["'Customs confiscated drug parcel in your name'", "'You are under digital arrest'", "'Do not disconnect video call'", "Fabricated arrest warrants"],
        known_attack_stages=["Law Enforcement Impersonation", "Fabricated Crime Accusation", "Digital Arrest Intimidation", "Asset Verification / Extortion Transfer"],
        dangerous_requests=["Stay on continuous video/audio call", "Keep conversation secret from family", "Transfer funds to 'RBI verification account'"],
        recommended_action="There is NO legal concept of 'Digital Arrest' under Indian Law. Law enforcement does not conduct arrests over video calls. Hang up and dial 1930.",
        severity="CRITICAL"
    ),
    "POLICE_IMPERSONATION": KnowledgeBaseCategory(
        category_id="POLICE_IMPERSONATION",
        name="Police / Judicial Impersonation",
        description="Fraudsters claim an urgent FIR, court warrant, or police inquiry against the victim or their family member, demanding immediate settlement money.",
        typical_intent=["REQUEST_PAYMENT", "REQUEST_KEEP_SECRET", "REQUEST_STAY_ON_CALL"],
        common_signals=["Threat of immediate arrest at residence", "Fake badge numbers or station names", "Demand for out-of-court fine settlement"],
        known_attack_stages=["Authority Assertion", "Legal Intimidation", "Time Pressure", "Extortion Payment Demand"],
        dangerous_requests=["Pay immediate bail or penalty fee via UPI", "Do not inform local lawyers or police"],
        recommended_action="Official police summons are delivered in person or via official registered post, never resolved through UPI transfer. Call 112.",
        severity="CRITICAL"
    ),
    "FAMILY_EMERGENCY": KnowledgeBaseCategory(
        category_id="FAMILY_EMERGENCY",
        name="Family Emergency / Virtual Kidnapping",
        description="Scammers use AI voice cloning or emotional distress pretending to be a son, grandson, or relative who has met with an accident or been arrested.",
        typical_intent=["REQUEST_PAYMENT", "REQUEST_KEEP_SECRET", "REQUEST_BANK_TRANSFER"],
        common_signals=["Distressed weeping voice", "'Mom/Dad I am in trouble'", "Demand for immediate hospital or bail money", "'Don't call anyone else'"],
        known_attack_stages=["Family Impersonation (Cloned Voice)", "Crisis Fabrication", "Panic Induction & Urgency", "Urgent Wire Transfer Request"],
        dangerous_requests=["Immediately send money to hospital/lawyer account", "Do not hang up to verify with other relatives"],
        recommended_action="Stay calm. Hang up and immediately call your family member back directly on their known personal phone number.",
        severity="CRITICAL"
    ),
    "CEO_FRAUD": KnowledgeBaseCategory(
        category_id="CEO_FRAUD",
        name="CEO / Executive Impersonation (Business Email/Voice Compromise)",
        description="Attackers clone senior management or executive voices directing finance or HR employees to initiate confidential vendor payments or purchase gift cards.",
        typical_intent=["REQUEST_BANK_TRANSFER", "REQUEST_KEEP_SECRET", "REQUEST_PAYMENT"],
        common_signals=["'Urgent confidential acquisition'", "'I am in a meeting, do not call back'", "Bypass standard procurement verification"],
        known_attack_stages=["Executive Authority Impersonation", "Confidentiality & Secrecy Mandate", "Urgent Wire Transfer Instruction"],
        dangerous_requests=["Execute wire transfer to new overseas bank account", "Bypass dual-authorization accounting controls"],
        recommended_action="Always confirm high-value or out-of-band financial requests via in-person or verified corporate communication channels.",
        severity="HIGH"
    ),
    "JOB_SCAM": KnowledgeBaseCategory(
        category_id="JOB_SCAM",
        name="Part-Time Job & Task Scam",
        description="Promises of high daily earnings for liking YouTube videos, rating hotels on Google Maps, or completing Telegram tasks that require upfront deposit payments.",
        typical_intent=["REQUEST_PAYMENT", "REQUEST_APP_INSTALLATION", "REQUEST_CLICK_LINK"],
        common_signals=["'Earn Rs. 3000 to 5000 daily from home'", "YouTube like task", "Telegram investment tier deposit", "Prepaid task clearance"],
        known_attack_stages=["Unsolicited Job Offer", "Initial Small Payout (Trust Hook)", "Prepaid High-Value Task Demand", "Withdrawal Lockout"],
        dangerous_requests=["Deposit security money to unlock earned commission", "Join private Telegram task group", "Register on unverified crypto exchange"],
        recommended_action="Legitimate employers never ask candidates to pay money or deposit security funds to receive salary or commissions.",
        severity="HIGH"
    ),
    "LOAN_SCAM": KnowledgeBaseCategory(
        category_id="LOAN_SCAM",
        name="Instant Fake Loan App Scam",
        description="Offers pre-approved, zero-documentation loans, demanding upfront processing fees or installing predatory apps that siphon contacts and photos for blackmail.",
        typical_intent=["REQUEST_PAYMENT", "REQUEST_APP_INSTALLATION", "REQUEST_PERSONAL_DATA"],
        common_signals=["Pre-approved loan without credit check", "Demand for upfront processing/GST fee", "Unregistered instant loan app APK link"],
        known_attack_stages=["Unsolicited Pre-Approval", "Processing Fee Demand", "Predatory Permissions Harvest", "Harassment & Extortion"],
        dangerous_requests=["Pay upfront processing/disbursement fee", "Install side-loaded loan APK granting full contact and photo permissions"],
        recommended_action="Only apply for loans through RBI-registered banks and NBFCs. Never pay upfront fees to receive a loan.",
        severity="HIGH"
    ),
    "INVESTMENT_SCAM": KnowledgeBaseCategory(
        category_id="INVESTMENT_SCAM",
        name="High-Yield Investment & Crypto Ponzi",
        description="Guaranteed astronomical returns on stock trading, forex, IPO allotments, or cryptocurrency investments managed by fake institutional experts.",
        typical_intent=["REQUEST_BANK_TRANSFER", "REQUEST_APP_INSTALLATION", "REQUEST_PAYMENT"],
        common_signals=["Guaranteed 30% to 50% monthly returns", "Institutional insider tips", "Fake trading dashboard showing inflated profits"],
        known_attack_stages=["Lure & Education", "Initial Deposit & Simulated Profit", "Escalated Investment Demand", "Withdrawal Denial & Extortion"],
        dangerous_requests=["Transfer savings to private individual accounts", "Install proprietary VIP trading application"],
        recommended_action="SEBI-registered advisors never guarantee returns. Verify brokers on official NSE/BSE registries.",
        severity="HIGH"
    ),
    "LOTTERY_SCAM": KnowledgeBaseCategory(
        category_id="LOTTERY_SCAM",
        name="Lottery & Prize Scam (KBC / Lucky Draw)",
        description="Informs the victim they won millions in a lucky draw or TV show lottery, requiring tax or customs clearance fee payments before disbursement.",
        typical_intent=["REQUEST_PAYMENT", "REQUEST_CARD_DETAILS", "REQUEST_PERSONAL_DATA"],
        common_signals=["'Congratulations you won 25 lakhs'", "KBC lottery department caller", "Demand for processing fee / TDS payment"],
        known_attack_stages=["False Prize Announcement", "Excitement Induction", "Tax/Disbursement Fee Solicitation", "Vanishing Scammer"],
        dangerous_requests=["Pay registration or clearance tax via UPI", "Provide bank account and Aadhaar credentials"],
        recommended_action="You cannot win a lottery or prize you never entered. Never pay money to receive winnings.",
        severity="MEDIUM"
    ),
    "COURIER_SCAM": KnowledgeBaseCategory(
        category_id="COURIER_SCAM",
        name="Courier / Delivery Scam (FedEx / Blue Dart)",
        description="Claims an incoming parcel is delayed due to an incorrect address or unpaid customs duty of 5 rupees, directing to a phishing link.",
        typical_intent=["REQUEST_CLICK_LINK", "REQUEST_PAYMENT", "REQUEST_CARD_DETAILS"],
        common_signals=["Parcel address update SMS", "Pay nominal Rs. 5 redelivery fee", "Phishing link resembling courier website"],
        known_attack_stages=["Delivery Notice", "Address Issue Pretense", "Phishing Link Payment", "Card Credential Harvesting"],
        dangerous_requests=["Click link to update delivery address", "Enter card details on unverified courier portal"],
        recommended_action="Track parcels solely through the official shopping platform or verified courier tracking website.",
        severity="MEDIUM"
    ),
    "CUSTOMER_CARE_SCAM": KnowledgeBaseCategory(
        category_id="CUSTOMER_CARE_SCAM",
        name="Fake Customer Support / Electricity Bill Cutoff",
        description="Fake customer care representatives or utility officers claiming power disconnection at 9:00 PM due to an unpaid electricity bill.",
        typical_intent=["REQUEST_APP_INSTALLATION", "REQUEST_PAYMENT", "REQUEST_SCREEN_SHARING"],
        common_signals=["'Electricity will be disconnected at 9:30 PM'", "Call this electricity officer number", "Pay unpaid bill immediately"],
        known_attack_stages=["Urgent Service Disruption Notice", "Help Desk Contact Lure", "Remote Access Installation", "Bank Account Drain"],
        dangerous_requests=["Install AnyDesk/QuickSupport to check bill", "Pay 10 rupees bill update fee"],
        recommended_action="Utility companies never disconnect power without prior written legal notices. Pay utility bills through official apps.",
        severity="HIGH"
    ),
    "REMOTE_ACCESS_SCAM": KnowledgeBaseCategory(
        category_id="REMOTE_ACCESS_SCAM",
        name="Remote Access & Screen Sharing Exploitation",
        description="Callers instruct the victim to install remote desktop tools (AnyDesk, TeamViewer, RustDesk) allowing fraudsters to view screens and steal OTPs in real-time.",
        typical_intent=["REQUEST_APP_INSTALLATION", "REQUEST_SCREEN_SHARING", "REQUEST_REMOTE_ACCESS"],
        common_signals=["'Download AnyDesk from Play Store'", "'Share 9-digit code'", "'Open your mobile banking app while sharing screen'"],
        known_attack_stages=["Technical Problem Pretense", "Remote Tool Installation", "Screen Access Code Solicitation", "Real-Time OTP Theft"],
        dangerous_requests=["Read out 9-digit remote access code", "Keep screen sharing active while entering PIN"],
        recommended_action="Never grant screen sharing or remote desktop access to unsolicited inbound callers. Disconnect immediately.",
        severity="CRITICAL"
    ),
    "TECH_SUPPORT_SCAM": KnowledgeBaseCategory(
        category_id="TECH_SUPPORT_SCAM",
        name="Tech Support / Antivirus Scam",
        description="Attackers claim the victim's computer or smartphone is infected with trojans or has an unauthorized Microsoft/Apple subscription renewal.",
        typical_intent=["REQUEST_REMOTE_ACCESS", "REQUEST_PAYMENT", "REQUEST_CARD_DETAILS"],
        common_signals=["'Your computer is sending virus alerts'", "Unauthorized $499 annual antivirus renewal", "Immediate refund assistance"],
        known_attack_stages=["Fake Security Alert", "Remote Access Diagnostic", "Simulated System Corruption", "Exorbitant Repair/Refund Fraud"],
        dangerous_requests=["Allow remote control to clean computer", "Enter bank login to accept refund"],
        recommended_action="Microsoft and Apple do not make unsolicited phone calls to report computer problems. Hang up.",
        severity="MEDIUM"
    ),
    "PHISHING": KnowledgeBaseCategory(
        category_id="PHISHING",
        name="Phishing Link & Credential Harvesting",
        description="Directing victims to fake login portals or payment gateways designed to capture netbanking passwords, credit cards, or identity credentials.",
        typical_intent=["REQUEST_CLICK_LINK", "REQUEST_PERSONAL_DATA", "REQUEST_CARD_DETAILS"],
        common_signals=["SMS verification URL", "Shortened suspicious bit.ly or tinyurl links", "Fake banking login page"],
        known_attack_stages=["Urgent Problem Hook", "Link Distribution", "Phishing Credential Capture", "Account Takeover"],
        dangerous_requests=["Click SMS link and log in with netbanking user ID and password"],
        recommended_action="Never click links received during a phone call. Type your bank's official URL directly into a trusted browser.",
        severity="HIGH"
    ),
    "IDENTITY_IMPERSONATION": KnowledgeBaseCategory(
        category_id="IDENTITY_IMPERSONATION",
        name="General Authority & Identity Impersonation",
        description="Impersonating government ministries, telecom regulators (TRAI), tax authorities (Income Tax department), or passport offices.",
        typical_intent=["REQUEST_PERSONAL_DATA", "REQUEST_PAYMENT", "REQUEST_DOCUMENT_UPLOAD"],
        common_signals=["'Income tax refund pending'", "'Passport application discrepancy'", "'TRAI telecom violation notice'"],
        known_attack_stages=["Official Authority Claim", "Regulatory Violation Threat", "Personal Data Solicitation", "Penalty Extortion"],
        dangerous_requests=["Share PAN, Aadhaar number, and date of birth", "Pay penalty clearance fee"],
        recommended_action="Verify any government notice through official government portals (.gov.in). Government departments do not demand payments via phone.",
        severity="HIGH"
    )
}

class KnowledgeBaseService:
    @staticmethod
    def get_all_categories() -> List[KnowledgeBaseCategory]:
        return list(KNOWLEDGE_BASE_DATA.values())

    @staticmethod
    def get_category_by_id(category_id: str) -> Optional[KnowledgeBaseCategory]:
        return KNOWLEDGE_BASE_DATA.get(category_id.upper())

    def list_categories(self) -> List[Dict[str, Any]]:
        return [
            {
                "category": cat.category_id,
                "name": cat.name,
                "description": cat.description,
                "typicalIntent": cat.typical_intent,
                "commonSignals": cat.common_signals,
                "attackStages": cat.known_attack_stages,
                "dangerousRequests": cat.dangerous_requests,
                "recommendedAction": cat.recommended_action,
                "severity": cat.severity,
                "version": cat.version,
                "lastUpdated": cat.last_updated
            }
            for cat in KNOWLEDGE_BASE_DATA.values()
        ]

    def get_category(self, category_key: str) -> Optional[Dict[str, Any]]:
        cat = KNOWLEDGE_BASE_DATA.get(category_key.upper())
        if not cat:
            return None
        return {
            "category": cat.category_id,
            "name": cat.name,
            "description": cat.description,
            "typicalIntent": cat.typical_intent,
            "commonSignals": cat.common_signals,
            "attackStages": cat.known_attack_stages,
            "dangerousRequests": cat.dangerous_requests,
            "recommendedAction": cat.recommended_action,
            "severity": cat.severity,
            "version": cat.version,
            "lastUpdated": cat.last_updated
        }

scam_knowledge_base = KnowledgeBaseService()

