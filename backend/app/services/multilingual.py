"""
Multilingual & Code-Switching Engine
Detects language usage (English, Tamil, Hindi, and mixed/code-switched speech like Tanglish / Hinglish).
Normalizes semantic intent while strictly preserving verbatim original evidence.
CRITICAL RULE: Code-switching itself is NEVER treated as suspicious.
"""

from typing import Dict, Any, List, Optional
import re

# Lexicons for phonetic transliterated and script patterns
TAMIL_PHONETIC_MARKERS = [
    "unga", "ungal", "sollunga", "irukku", "aagidum", "panrathu", "illai", "kudunga", "paathutu",
    "theriyuma", "vanakkam", "kaasu", "panam", "seiyunga", "kettukonga", "podunga", "kadasiya",
    "immediate-ah", "account-la", "bank-la", "call-ah", "card-la", "number-ah"
]

HINDI_PHONETIC_MARKERS = [
    "aapka", "aapki", "kijiye", "batayein", "hoga", "aayega", "turant", "karen", "namaskar",
    "paise", "bhejiye", "band", "rukhiye", "kholo", "dena", "suno", "samjhe", "police-waale",
    "account-mein", "bank-se", "police-se", "otp-ko"
]

TAMIL_UNICODE_RANGE = re.compile(r'[\u0B80-\u0BFF]')
HINDI_UNICODE_RANGE = re.compile(r'[\u0900-\u097F]')

# Common multilingual scam phrase translation and intent normalization map
NORMALIZATION_MAP = [
    {
        "pattern": r"(?:unga\s+account\s+block\s+aagidum|account\s+block\s+aayidum)",
        "normalized": "Your account will be blocked.",
        "signals": ["THREAT", "URGENCY"],
        "lang": "Tamil-English"
    },
    {
        "pattern": r"(?:otp\s+immediate-ah\s+sollunga|otp\s+sollunga|otp\s+kudunga)",
        "normalized": "Please tell me the OTP immediately.",
        "signals": ["OTP_REQUEST", "URGENCY"],
        "lang": "Tamil-English"
    },
    {
        "pattern": r"(?:aapka\s+account\s+block\s+ho\s+jayega|account\s+band\s+hoga)",
        "normalized": "Your account will be blocked.",
        "signals": ["THREAT", "URGENCY"],
        "lang": "Hindi-English"
    },
    {
        "pattern": r"(?:turant\s+otp\s+batayein|jaldi\s+otp\s+bhejiye|otp\s+batao)",
        "normalized": "Tell me the OTP immediately.",
        "signals": ["OTP_REQUEST", "URGENCY"],
        "lang": "Hindi-English"
    },
    {
        "pattern": r"(?:your\s+account-la\s+suspicious\s+transaction\s+irukku|account-la\s+problem)",
        "normalized": "There is a suspicious transaction in your account.",
        "signals": ["PRETEXT", "ACCOUNT_PROBLEM"],
        "lang": "Tamil-English"
    },
    {
        "pattern": r"(?:police\s+case\s+aagidum|digital\s+arrest\s+pannuvom)",
        "normalized": "A police case will be filed / digital arrest will occur.",
        "signals": ["EXTORTION", "THREAT"],
        "lang": "Tamil-English"
    },
    {
        "pattern": r"(?:police\s+aayegi|digital\s+arrest\s+hoga|jail\s+jana\s+padega)",
        "normalized": "Police will arrive / you will face digital arrest and jail.",
        "signals": ["EXTORTION", "THREAT"],
        "lang": "Hindi-English"
    }
]

class MultilingualEngine:
    def __init__(self):
        pass

    def analyze_language(self, text: str) -> Dict[str, Any]:
        """
        Detects primary and secondary languages, code-switching presence,
        and provides semantic normalizations without altering the verbatim original evidence.
        """
        text_lower = text.lower()
        words = re.findall(r'\b\w+\b', text_lower)
        total_words = max(len(words), 1)

        # Check script presence
        has_tamil_script = bool(TAMIL_UNICODE_RANGE.search(text))
        has_hindi_script = bool(HINDI_UNICODE_RANGE.search(text))

        # Check phonetic marker counts
        tamil_markers_found = [m for m in TAMIL_PHONETIC_MARKERS if m in text_lower]
        hindi_markers_found = [m for m in HINDI_PHONETIC_MARKERS if m in text_lower]

        tamil_score = (len(tamil_markers_found) * 2) + (10 if has_tamil_script else 0)
        hindi_score = (len(hindi_markers_found) * 2) + (10 if has_hindi_script else 0)

        # English indicator: words in ascii
        ascii_words = sum(1 for w in words if all(ord(c) < 128 for c in w))
        english_score = ascii_words

        # Determine Primary & Secondary Languages
        is_code_switched = False
        primary_language = "English"
        secondary_language = None
        dialect_tag = "Standard English"

        if tamil_score > 0 and english_score > 2:
            is_code_switched = True
            primary_language = "Tamil" if tamil_score > english_score else "English"
            secondary_language = "English" if primary_language == "Tamil" else "Tamil"
            dialect_tag = "Tamil-English Code-Switching (Tanglish)"
        elif hindi_score > 0 and english_score > 2:
            is_code_switched = True
            primary_language = "Hindi" if hindi_score > english_score else "English"
            secondary_language = "English" if primary_language == "Hindi" else "Hindi"
            dialect_tag = "Hindi-English Code-Switching (Hinglish)"
        elif tamil_score > 3 or has_tamil_script:
            primary_language = "Tamil"
            dialect_tag = "Tamil"
        elif hindi_score > 3 or has_hindi_script:
            primary_language = "Hindi"
            dialect_tag = "Hindi"

        # Semantic Normalization & Evidence Preservation
        normalizations: List[Dict[str, Any]] = []
        for rule in NORMALIZATION_MAP:
            matches = re.finditer(rule["pattern"], text_lower)
            for m in matches:
                matched_verbatim = text[m.start():m.end()]
                normalizations.append({
                    "originalVerbatim": matched_verbatim,
                    "normalizedMeaning": rule["normalized"],
                    "detectedSignals": rule["signals"],
                    "language": rule["lang"]
                })

        return {
            "primaryLanguage": primary_language,
            "secondaryLanguage": secondary_language,
            "isCodeSwitched": is_code_switched,
            "dialectTag": dialect_tag,
            "codeSwitchingPenalty": 0,  # CRITICAL: Always 0; never penalized
            "detectedNormalizations": normalizations,
            "verbatimPreserved": text
        }

multilingual_engine = MultilingualEngine()
