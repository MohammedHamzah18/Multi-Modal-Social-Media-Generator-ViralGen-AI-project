"""Application configuration via environment variables."""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "VoiceOps Sentinel"
    app_version: str = "1.0.0"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    # SQLite works locally without installing PostgreSQL (recommended for Windows dev)
    database_url: str = "sqlite+aiosqlite:///./data/voiceops.db"

    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    )

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    whisper_model: str = "whisper-1"

    huggingface_token: str = ""
    pyannote_model: str = "pyannote/speaker-diarization-3.1"
    enable_pyannote: bool = True

    upload_dir: str = "uploads"
    max_upload_size_mb: int = 100
    allowed_audio_extensions: str = "mp3,wav,flac"

    presidio_enabled: bool = True
    log_level: str = "INFO"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_extensions(self) -> List[str]:
        return [e.strip().lower() for e in self.allowed_audio_extensions.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
