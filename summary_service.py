"""AI summarization and action item extraction."""

import json
import logging
from typing import Any

from openai import AsyncOpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class SummaryService:
    def __init__(self) -> None:
        self.client = AsyncOpenAI(api_key=settings.openai_api_key or "sk-demo")

    async def generate_summary(self, transcript: str) -> dict[str, Any]:
        if settings.openai_api_key:
            try:
                return await self._openai_summary(transcript)
            except Exception as exc:
                logger.exception("Summary generation failed: %s", exc)
        return self._demo_summary(transcript)

    async def extract_action_items(self, transcript: str) -> list[dict[str, Any]]:
        if settings.openai_api_key:
            try:
                return await self._openai_actions(transcript)
            except Exception as exc:
                logger.exception("Action extraction failed: %s", exc)
        return self._demo_actions()

    async def _openai_summary(self, transcript: str) -> dict[str, Any]:
        response = await self.client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an enterprise call intelligence assistant. "
                        "Return JSON with: executive_summary (2-3 sentences), "
                        "key_points (array of 3-6 bullet strings)."
                    ),
                },
                {"role": "user", "content": transcript[:12000]},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        return json.loads(response.choices[0].message.content or "{}")

    async def _openai_actions(self, transcript: str) -> list[dict[str, Any]]:
        response = await self.client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Extract action items from the call transcript. "
                        "Return JSON: {items: [{title, description, assignee, priority}]}. "
                        "priority is low|medium|high."
                    ),
                },
                {"role": "user", "content": transcript[:12000]},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        data = json.loads(response.choices[0].message.content or "{}")
        return data.get("items", [])

    def _demo_summary(self, transcript: str) -> dict[str, Any]:
        return {
            "executive_summary": (
                "Customer reported duplicate billing on their account. "
                "Agent verified account details, identified the duplicate charge, "
                "and committed to sending a refund form with a follow-up callback."
            ),
            "key_points": [
                "Customer experienced duplicate billing charge",
                "Agent verified email and phone on file",
                "Duplicate charge located in billing system",
                "Refund form to be sent to customer",
                "Callback scheduled within 24 hours",
            ],
        }

    def _demo_actions(self) -> list[dict[str, Any]]:
        return [
            {
                "title": "Send refund form",
                "description": "Email refund documentation to customer",
                "assignee": "Agent",
                "priority": "high",
            },
            {
                "title": "Schedule callback",
                "description": "Follow up within 24 hours to confirm refund",
                "assignee": "Agent",
                "priority": "medium",
            },
            {
                "title": "Verify account details",
                "description": "Confirm billing profile matches customer records",
                "assignee": "Billing Team",
                "priority": "medium",
            },
        ]
