"""Async call processing pipeline orchestrating all AI services."""

import logging
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.models.action_item import ActionItem, ActionPriority
from app.models.call import Call, CallStatus
from app.models.notification import Notification
from app.models.sentiment import SentimentAnalysis
from app.models.summary import Summary
from app.models.transcript import Transcript
from app.services.audio_utils import get_audio_duration
from app.services.diarization_service import DiarizationService
from app.services.pii_service import PIIService
from app.services.sentiment_service import SentimentService
from app.services.summary_service import SummaryService
from app.services.whisper_service import WhisperService

logger = logging.getLogger(__name__)


class ProcessingPipeline:
    def __init__(self) -> None:
        self.whisper = WhisperService()
        self.diarization = DiarizationService()
        self.pii = PIIService()
        self.sentiment = SentimentService()
        self.summary = SummaryService()

    async def process_call(self, call_id: int) -> None:
        async with AsyncSessionLocal() as db:
            try:
                await self._run(db, call_id)
                await db.commit()
            except Exception as exc:
                await db.rollback()
                logger.exception("Processing failed for call %s: %s", call_id, exc)
                await self._mark_failed(call_id, str(exc))

    async def _run(self, db: AsyncSession, call_id: int) -> None:
        result = await db.execute(select(Call).where(Call.id == call_id))
        call = result.scalar_one_or_none()
        if not call:
            return

        call.status = CallStatus.PROCESSING
        await db.flush()

        audio_path = Path(call.file_path)
        duration = get_audio_duration(audio_path)
        if duration:
            call.duration_seconds = duration

        transcription = await self.whisper.transcribe(audio_path)
        segments = transcription["segments"]
        full_text = transcription["text"]

        segments = await self.diarization.diarize(audio_path, segments)
        redacted_segments = self.pii.redact_segments(segments)
        redacted_text = self.pii.redact_text(full_text)

        speakers = list({s.get("speaker") for s in segments if s.get("speaker")})

        transcript = Transcript(
            call_id=call.id,
            full_text=full_text,
            redacted_text=redacted_text,
            segments=segments,
            redacted_segments=redacted_segments,
            speakers=speakers,
        )
        db.add(transcript)

        sentiment_data = await self.sentiment.analyze(segments, full_text)
        db.add(
            SentimentAnalysis(
                call_id=call.id,
                overall_label=sentiment_data["overall_label"],
                overall_score=sentiment_data["overall_score"],
                timeline=sentiment_data["timeline"],
            )
        )

        summary_data = await self.summary.generate_summary(full_text)
        db.add(
            Summary(
                call_id=call.id,
                executive_summary=summary_data.get("executive_summary", ""),
                key_points=summary_data.get("key_points", []),
            )
        )

        actions = await self.summary.extract_action_items(full_text)
        for item in actions:
            priority_str = item.get("priority", "medium").lower()
            try:
                priority = ActionPriority(priority_str)
            except ValueError:
                priority = ActionPriority.MEDIUM
            db.add(
                ActionItem(
                    call_id=call.id,
                    title=item.get("title", "Untitled action"),
                    description=item.get("description"),
                    assignee=item.get("assignee"),
                    priority=priority,
                )
            )

        call.status = CallStatus.COMPLETED
        call.processed_at = datetime.now(timezone.utc)

        db.add(
            Notification(
                user_id=call.user_id,
                title="Call processing complete",
                message=f'"{call.title}" has been analyzed and is ready to review.',
                link=f"/calls/{call.id}",
            )
        )
        await db.flush()
        logger.info("Call %s processed successfully", call_id)

    async def _mark_failed(self, call_id: int, error: str) -> None:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Call).where(Call.id == call_id))
            call = result.scalar_one_or_none()
            if call:
                call.status = CallStatus.FAILED
                call.error_message = error[:2000]
                await db.commit()
