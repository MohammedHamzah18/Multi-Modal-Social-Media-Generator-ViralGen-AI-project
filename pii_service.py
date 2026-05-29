"""PII detection and redaction using Microsoft Presidio."""

import logging
import re
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Regex fallback when Presidio is unavailable
PII_PATTERNS = [
    (re.compile(r"\b[\w.-]+@[\w.-]+\.\w+\b"), "<EMAIL>"),
    (re.compile(r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b"), "<PHONE>"),
    (re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b"), "<CREDIT_CARD>"),
    (re.compile(r"\b\d{3}-\d{2}-\d{4}\b"), "<SSN>"),
]


class PIIService:
    def __init__(self) -> None:
        self._analyzer = None
        self._anonymizer = None
        if settings.presidio_enabled:
            try:
                from presidio_analyzer import AnalyzerEngine
                from presidio_anonymizer import AnonymizerEngine

                self._analyzer = AnalyzerEngine()
                self._anonymizer = AnonymizerEngine()
            except Exception as exc:
                logger.warning("Presidio init failed, using regex: %s", exc)

    def redact_text(self, text: str) -> str:
        if self._analyzer and self._anonymizer:
            try:
                results = self._analyzer.analyze(
                    text=text,
                    language="en",
                    entities=[
                        "PHONE_NUMBER",
                        "EMAIL_ADDRESS",
                        "CREDIT_CARD",
                        "US_SSN",
                        "PERSON",
                        "IP_ADDRESS",
                    ],
                )
                anonymized = self._anonymizer.anonymize(
                    text=text,
                    analyzer_results=results,
                )
                return anonymized.text
            except Exception as exc:
                logger.warning("Presidio redaction failed: %s", exc)
        return self._regex_redact(text)

    def _regex_redact(self, text: str) -> str:
        result = text
        for pattern, replacement in PII_PATTERNS:
            result = pattern.sub(replacement, result)
        return result

    def redact_segments(self, segments: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [
            {**seg, "text": self.redact_text(seg.get("text", ""))}
            for seg in segments
        ]
