"""Sentiment analysis using OpenAI with rule-based fallback."""

import json
import logging
from typing import Any

from openai import AsyncOpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class SentimentService:
    def __init__(self) -> None:
        self.client = AsyncOpenAI(api_key=settings.openai_api_key or "sk-demo")

    async def analyze(
        self, segments: list[dict[str, Any]], full_text: str
    ) -> dict[str, Any]:
        if settings.openai_api_key:
            try:
                return await self._analyze_with_openai(segments, full_text)
            except Exception as exc:
                logger.exception("OpenAI sentiment failed: %s", exc)
        return self._analyze_heuristic(segments)

    async def _analyze_with_openai(
        self, segments: list[dict], full_text: str
    ) -> dict[str, Any]:
        customer_segments = [
            s for s in segments if s.get("speaker", "").find("Customer") >= 0
        ]
        sample = "\n".join(s["text"] for s in customer_segments[:12]) or full_text[:2000]

        response = await self.client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Analyze customer sentiment in a support call. "
                        "Return JSON only with keys: overall_label (positive|neutral|negative), "
                        "overall_score (-1 to 1 float), timeline (array of "
                        "{start, end, label, score} for each customer utterance chunk)."
                    ),
                },
                {"role": "user", "content": sample},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        content = response.choices[0].message.content or "{}"
        data = json.loads(content)
        return {
            "overall_label": data.get("overall_label", "neutral"),
            "overall_score": float(data.get("overall_score", 0.0)),
            "timeline": data.get("timeline", []),
        }

    def _analyze_heuristic(self, segments: list[dict]) -> dict[str, Any]:
        positive_words = {"thank", "great", "appreciate", "happy", "resolved", "perfect"}
        negative_words = {"angry", "frustrated", "terrible", "worst", "unacceptable", "upset"}

        timeline = []
        scores = []
        for seg in segments:
            if "Customer" not in seg.get("speaker", ""):
                continue
            text_lower = seg["text"].lower()
            pos = sum(1 for w in positive_words if w in text_lower)
            neg = sum(1 for w in negative_words if w in text_lower)
            score = (pos - neg) / max(pos + neg, 1)
            label = "positive" if score > 0.2 else "negative" if score < -0.2 else "neutral"
            timeline.append(
                {
                    "start": seg["start"],
                    "end": seg["end"],
                    "label": label,
                    "score": round(score, 2),
                }
            )
            scores.append(score)

        avg = sum(scores) / len(scores) if scores else 0.0
        overall = "positive" if avg > 0.15 else "negative" if avg < -0.15 else "neutral"
        return {
            "overall_label": overall,
            "overall_score": round(avg, 2),
            "timeline": timeline,
        }
