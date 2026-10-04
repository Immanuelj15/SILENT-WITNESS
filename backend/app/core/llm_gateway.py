import os
import json
import logging
import re
from typing import Dict, Any, List, Optional
import httpx
from backend.app.core.config import settings

logger = logging.getLogger("LLMGateway")


class MockLLMService:
    """
    Deterministic Token-Saving Mock LLM Service.
    Produces instant, zero-cost scam verdicts for structural development and offline testing.
    """

    @classmethod
    def evaluate(cls, transcript: str, caller_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        text_lower = (transcript or "").lower()

        # 1. Customs Seizure Consignment Extortion
        customs_triggers = [
            "customs", "consignment", "parcel seized", "clearance fee", "penalty clearance",
            "illegal parcel", "narcotics found", "customs clearance", "dhl parcel", "fedex parcel"
        ]
        if any(term in text_lower for term in customs_triggers) and any(term in text_lower for term in ["fee", "penalty", "clearance", "money", "pay", "charges", "transfer", "tax", "seized"]):
            return {
                "threat_level": "CRITICAL",
                "composite_risk": 0.93,
                "identified_scam_type": "Customs Seizure Consignment Extortion",
                "live_coaching_directives": [
                    "CRITICAL: Customs departments NEVER demand penalty clearance fees over phone calls.",
                    "Do NOT transfer money to personal bank accounts or UPI IDs for customs clearance.",
                    "Legitimate customs notices are served via official government postal mail.",
                    "Disconnect immediately and report to Cyber Crime Helpline 1930."
                ],
                "explanation": "Extortion attempt falsely alleging illegal consignment seizure and demanding immediate clearance fee payment.",
                "is_mock": True,
                "provider": "MockLLMService"
            }

        # 2. Electricity Disconnection / Remote Screen Share
        electricity_triggers = ["electricity", "power disconnection", "power will be cut", "electricity bill", "bill unpaid", "light cut"]
        if any(term in text_lower for term in electricity_triggers):
            return {
                "threat_level": "CRITICAL",
                "composite_risk": 0.92,
                "identified_scam_type": "Electricity Disconnection / Remote Screen Share",
                "live_coaching_directives": [
                    "CRITICAL: Electricity boards do NOT disconnect power without prior written notice.",
                    "NEVER download AnyDesk, QuickSupport, or share OTP to update electricity bills.",
                    "Pay utility bills ONLY through official state electricity portals or apps.",
                    "Disconnect call immediately."
                ],
                "explanation": "Urgent extortion claiming immediate power disconnection to coerce remote desktop installation and OTP disclosure.",
                "is_mock": True,
                "provider": "MockLLMService"
            }

        # 3. Digital Arrest / Police / CBI Impersonation
        digital_arrest_triggers = [
            "digital arrest", "mumbai police", "police department calling", "police department",
            "cbi court order", "cbi", "cyber crime", "ed officer", "narcotics", "arrest warrant",
            "illegal parcel", "passport seized", "drugs found", "cannot hang up", "stay on video",
            "do not cut this video call", "supreme court order"
        ]
        if any(term in text_lower for term in digital_arrest_triggers):
            return {
                "threat_level": "CRITICAL_ATTACK_DETECTED",
                "composite_risk": 0.96,
                "identified_scam_type": "Digital Arrest / Law Enforcement Extortion",
                "live_coaching_directives": [
                    "POLICE NEVER CONDUCT INQUIRY ON WHATSAPP",
                    "CRITICAL: Digital arrest does NOT exist in Indian or international law.",
                    "Police, CBI, and Customs NEVER conduct arrests or court proceedings via WhatsApp/VoIP.",
                    "Do NOT transfer any funds for 'verification' or 'security clearance'.",
                    "Terminate call immediately and report to National Cyber Crime Helpline (1930)."
                ],
                "explanation": "Caller is impersonating law enforcement officers, claiming seized parcels or warrants, and attempting extortion under the pretext of 'digital arrest'.",
                "is_mock": True,
                "provider": "MockLLMService"
            }

        # 4. Remote Access Coercion (AnyDesk, TeamViewer, RustDesk, QuickSupport)
        remote_access_triggers = [
            "anydesk", "teamviewer", "rustdesk", "quicksupport", "screen share",
            "share screen", "share your screen", "start sharing", "open anydesk",
            "download quicksupport", "9 digit code", "grant permission"
        ]
        if any(term in text_lower for term in remote_access_triggers):
            return {
                "threat_level": "CRITICAL",
                "composite_risk": 0.94,
                "identified_scam_type": "Remote Access Coercion",
                "live_coaching_directives": [
                    "CRITICAL: Caller is instructing you to install remote access software.",
                    "NEVER download AnyDesk, TeamViewer, or RustDesk at caller's request.",
                    "Do NOT share the 9-digit remote connection code.",
                    "Stop screen sharing immediately and disconnect."
                ],
                "explanation": "High-risk screen sharing and remote desktop coercion detected. Scammers use remote access tools to drain bank accounts and observe 2FA credentials.",
                "is_mock": True,
                "provider": "MockLLMService"
            }

        # 5. Financial OTP / KYC Expiration Scams
        financial_otp_triggers = [
            "otp", "tell me your otp", "verification code", "bank account details", "bank details",
            "bank account", "one time password", "kyc", "account blocked", "account will be blocked",
            "pan card expired", "share otp", "verify otp", "cvv", "card expiry", "sbi kyc", "sim block"
        ]
        if any(term in text_lower for term in financial_otp_triggers):
            return {
                "threat_level": "CRITICAL",
                "composite_risk": 0.95,
                "identified_scam_type": "Financial OTP / Credential Harvesting Theft",
                "live_coaching_directives": [
                    "CRITICAL: DO NOT SHARE OTP - BANK OFFICIALS NEVER ASK FOR PASSWORDS",
                    "NEVER read out 4-digit or 6-digit codes received via SMS",
                    "Hang up and call the number printed on your debit card immediately"
                ],
                "explanation": "Urgent pressure detected demanding 2FA credentials or bank account details.",
                "is_mock": True,
                "provider": "MockLLMService"
            }

        # 6. Routine / Benign Calls (Baseline 0.05)
        return {
            "threat_level": "SAFE",
            "composite_risk": 0.05,
            "identified_scam_type": "Benign / Routine Conversation",
            "live_coaching_directives": [
                "Conversation shows standard conversational patterns.",
                "Maintain normal vigilance regarding personal credentials."
            ],
            "explanation": "No coercion, false authority, urgency tactics, or credential harvesting detected in the spoken dialogue.",
            "is_mock": True,
            "provider": "MockLLMService"
        }


class LLMGateway:
    """
    Token-Saving LLM Gateway.
    Safely gates OpenRouter inference behind an explicit `sk-or-v1-...` key.
    Defaults to zero-token `MockLLMService` when unset or set to `MOCK_DEV`.
    """

    OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
    DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct"

    @classmethod
    def get_api_key(cls) -> str:
        return os.getenv("OPENROUTER_API_KEY", getattr(settings, "OPENROUTER_API_KEY", "")).strip()

    @classmethod
    def is_live_key_configured(cls) -> bool:
        key = cls.get_api_key()
        return bool(key and key != "MOCK_DEV" and key.startswith("sk-or-v1-"))

    @classmethod
    def evaluate_dialogue(cls, transcript: str, caller_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Synchronous evaluation routing.
        """
        if not cls.is_live_key_configured():
            logger.info("OpenRouter key not configured or set to MOCK_DEV. Using MockLLMService.")
            return MockLLMService.evaluate(transcript, caller_metadata)

        # Live OpenRouter evaluation with HTTPX (1.5s latency guardrail)
        try:
            with httpx.Client(timeout=1.5) as client:
                return cls._query_openrouter(client, transcript, caller_metadata)
        except Exception as e:
            logger.warning(f"OpenRouter query exceeded 1.5s latency or failed ({e}). Swiftly falling back to MockLLMService.")
            fallback = MockLLMService.evaluate(transcript, caller_metadata)
            fallback["fallback_reason"] = str(e)
            return fallback

    @classmethod
    async def evaluate_dialogue_async(cls, transcript: str, caller_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Asynchronous evaluation routing for WebSockets and async routes with 1.5s latency safeguard.
        """
        if not cls.is_live_key_configured():
            return MockLLMService.evaluate(transcript, caller_metadata)

        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                return await cls._query_openrouter_async(client, transcript, caller_metadata)
        except Exception as e:
            logger.warning(f"OpenRouter async query exceeded 1.5s latency or failed ({e}). Swiftly falling back to MockLLMService.")
            fallback = MockLLMService.evaluate(transcript, caller_metadata)
            fallback["fallback_reason"] = str(e)
            return fallback

    @classmethod
    def _build_prompt(cls, transcript: str, caller_metadata: Optional[Dict[str, Any]]) -> List[Dict[str, str]]:
        system_instruction = (
            "You are SILENT WITNESS, an expert real-time conversational fraud interception intelligence engine. "
            "Analyze the ongoing call transcript for social engineering, financial fraud, impersonation, and coercion.\n"
            "Output MUST be strict JSON matching this schema:\n"
            "{\n"
            '  "threat_level": "SAFE" | "CAUTION" | "HIGH" | "CRITICAL",\n'
            '  "composite_risk": float between 0.0 and 1.0,\n'
            '  "identified_scam_type": string,\n'
            '  "live_coaching_directives": string[],\n'
            '  "explanation": string\n'
            "}"
        )
        user_content = f"Caller Metadata: {json.dumps(caller_metadata or {})}\nTranscript: {transcript}"
        return [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_content}
        ]

    @classmethod
    def _query_openrouter(cls, client: httpx.Client, transcript: str, caller_metadata: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        api_key = cls.get_api_key()
        model = getattr(settings, "OPENROUTER_MODEL", cls.DEFAULT_MODEL)

        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://github.com/Immanuelj15/SILENT-WITNESS",
            "X-Title": "Silent Witness Defense Engine",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": cls._build_prompt(transcript, caller_metadata),
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }

        resp = client.post(cls.OPENROUTER_ENDPOINT, headers=headers, json=payload)
        resp.raise_for_status()
        raw_text = resp.json()["choices"][0]["message"]["content"]
        result = json.loads(raw_text)
        result["is_mock"] = False
        result["provider"] = "OpenRouter"
        result["model"] = model
        return result

    @classmethod
    async def _query_openrouter_async(cls, client: httpx.AsyncClient, transcript: str, caller_metadata: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        api_key = cls.get_api_key()
        model = getattr(settings, "OPENROUTER_MODEL", cls.DEFAULT_MODEL)

        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://github.com/Immanuelj15/SILENT-WITNESS",
            "X-Title": "Silent Witness Defense Engine",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": cls._build_prompt(transcript, caller_metadata),
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }

        resp = await client.post(cls.OPENROUTER_ENDPOINT, headers=headers, json=payload)
        resp.raise_for_status()
        raw_text = resp.json()["choices"][0]["message"]["content"]
        result = json.loads(raw_text)
        result["is_mock"] = False
        result["provider"] = "OpenRouter"
        result["model"] = model
        return result


# Global singleton helper
llm_gateway = LLMGateway()
