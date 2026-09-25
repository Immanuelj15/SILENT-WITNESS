import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")
    APP_NAME: str = "Silent Witness"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    DATABASE_URL: str = "sqlite:///./silent_witness.db"

    # Audio limits
    MAX_AUDIO_UPLOAD_SIZE_MB: int = 25
    SUPPORTED_AUDIO_FORMATS: List[str] = ["wav", "mp3", "m4a", "webm", "ogg"]
    SAMPLE_RATE: int = 16000
    CHUNK_DURATION_SEC: float = 3.0

    # Risk Engine Configurable Weights (Section 6: Must sum to 1.0)
    WEIGHT_VOICE_RISK: float = 0.25
    WEIGHT_SOCIAL_ENGINEERING: float = 0.20
    WEIGHT_FRAUD_INTENT: float = 0.20
    WEIGHT_IDENTITY_RISK: float = 0.15
    WEIGHT_THREAT_RISK: float = 0.10
    WEIGHT_EVIDENCE_RISK: float = 0.10

    # Risk Thresholds & States (Section 45: SAFE, CAUTION, SUSPICIOUS, HIGH_RISK, CRITICAL)
    THRESHOLD_SAFE: int = 20
    THRESHOLD_CAUTION: int = 40
    THRESHOLD_SUSPICIOUS: int = 65
    THRESHOLD_HIGH: int = 80
    THRESHOLD_CRITICAL: int = 88

    # Local AI / LLM Configuration
    LLM_PROVIDER: str = "local_agent"
    LLM_MODEL_NAME: str = "Nemotron-3-Nano-4B-GGUF"
    LLM_API_BASE: str = "http://localhost:8080/v1"
    LLM_MAX_TOKENS: int = 512
    LLM_TEMPERATURE: float = 0.1

    # Privacy & Storage
    ENABLE_AUDIO_STORAGE: bool = False
    AUTO_CLEANUP_TEMP_FILES: bool = True
    TEMP_STORAGE_DIR: str = "./temp_audio"
    DATA_RETENTION_HOURS: int = 24

settings = Settings()
os.makedirs(settings.TEMP_STORAGE_DIR, exist_ok=True)
