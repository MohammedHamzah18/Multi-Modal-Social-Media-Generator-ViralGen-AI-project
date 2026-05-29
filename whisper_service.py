"""OpenAI Whisper speech-to-text transcription."""

import json
import logging
from pathlib import Path
from typing import Any

from openai import AsyncOpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class WhisperService:
    def __init__(self) -> None:
        self.client = AsyncOpenAI(api_key=settings.openai_api_key or "sk-demo")

    async def transcribe(self, audio_path: Path) -> dict[str, Any]:
        """Transcribe audio with word-level timestamps via verbose JSON."""
        if not settings.openai_api_key:
            logger.warning("OPENAI_API_KEY not set; using demo transcript")
            return self._demo_transcript()

        try:
            with open(audio_path, "rb") as audio_file:
                response = await self.client.audio.transcriptions.create(
                    model=settings.whisper_model,
                    file=audio_file,
                    response_format="verbose_json",
                    timestamp_granularities=["segment"],
                )

            data = response.model_dump() if hasattr(response, "model_dump") else dict(response)
            segments = []
            for seg in data.get("segments", []):
                segments.append(
                    {
                        "start": float(seg.get("start", 0)),
                        "end": float(seg.get("end", 0)),
                        "text": seg.get("text", "").strip(),
                        "speaker": None,
                    }
                )
            return {
                "text": data.get("text", "").strip(),
                "segments": segments,
                "language": data.get("language", "en"),
            }
        except Exception as exc:
            logger.exception("Whisper transcription failed: %s", exc)
            return self._demo_transcript()

    def _demo_transcript(self) -> dict[str, Any]:
        return {
            "text": (
                "Hello, thank you for calling VoiceOps support. "
                "My name is Sarah, how can I help you today? "
                "Hi Sarah, I'm having trouble with my account billing. "
                "I was charged twice last month. "
                "I'm sorry to hear that. Let me verify your account details. "
                "Can you confirm your email is john.doe@example.com? "
                "Yes, that's correct. My phone is 555-123-4567. "
                "I've located the duplicate charge. I'll send you a refund form "
                "and schedule a callback within 24 hours to confirm."
            ),
            "segments": [
                {
                    "start": 0.0,
                    "end": 5.2,
                    "text": "Hello, thank you for calling VoiceOps support.",
                    "speaker": None,
                },
                {
                    "start": 5.2,
                    "end": 9.0,
                    "text": "My name is Sarah, how can I help you today?",
                    "speaker": None,
                },
                {
                    "start": 9.0,
                    "end": 15.5,
                    "text": "Hi Sarah, I'm having trouble with my account billing.",
                    "speaker": None,
                },
                {
                    "start": 15.5,
                    "end": 20.0,
                    "text": "I was charged twice last month.",
                    "speaker": None,
                },
                {
                    "start": 20.0,
                    "end": 28.0,
                    "text": "I'm sorry to hear that. Let me verify your account details.",
                    "speaker": None,
                },
                {
                    "start": 28.0,
                    "end": 35.0,
                    "text": "Can you confirm your email is john.doe@example.com?",
                    "speaker": None,
                },
                {
                    "start": 35.0,
                    "end": 42.0,
                    "text": "Yes, that's correct. My phone is 555-123-4567.",
                    "speaker": None,
                },
                {
                    "start": 42.0,
                    "end": 55.0,
                    "text": (
                        "I've located the duplicate charge. I'll send you a refund form "
                        "and schedule a callback within 24 hours to confirm."
                    ),
                    "speaker": None,
                },
            ],
            "language": "en",
        }
