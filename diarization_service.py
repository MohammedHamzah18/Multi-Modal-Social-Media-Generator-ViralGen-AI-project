"""Speaker diarization via Pyannote with heuristic fallback."""

import logging
from pathlib import Path
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

SPEAKER_LABELS = {
    "SPEAKER_00": "Speaker A (Agent)",
    "SPEAKER_01": "Speaker B (Customer)",
}


class DiarizationService:
    def __init__(self) -> None:
        self._pipeline = None

    def _load_pipeline(self):
        if self._pipeline is not None:
            return self._pipeline
        if not settings.enable_pyannote or not settings.huggingface_token:
            return None
        try:
            from pyannote.audio import Pipeline

            self._pipeline = Pipeline.from_pretrained(
                settings.pyannote_model,
                use_auth_token=settings.huggingface_token,
            )
            return self._pipeline
        except Exception as exc:
            logger.warning("Pyannote unavailable, using fallback: %s", exc)
            return None

    async def diarize(
        self, audio_path: Path, segments: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        pipeline = self._load_pipeline()
        if pipeline is None:
            return self._alternate_speakers(segments)

        try:
            diarization = pipeline(str(audio_path))
            labeled = self._assign_speakers(segments, diarization)
            return labeled
        except Exception as exc:
            logger.exception("Diarization failed: %s", exc)
            return self._alternate_speakers(segments)

    def _assign_speakers(self, segments: list[dict], diarization) -> list[dict]:
        speaker_map: dict[str, str] = {}
        label_idx = 0
        result = []

        for seg in segments:
            mid = (seg["start"] + seg["end"]) / 2
            best_speaker = "SPEAKER_00"
            best_overlap = 0.0

            for turn, _, speaker in diarization.itertracks(yield_label=True):
                overlap_start = max(turn.start, seg["start"])
                overlap_end = min(turn.end, seg["end"])
                overlap = max(0.0, overlap_end - overlap_start)
                if overlap > best_overlap:
                    best_overlap = overlap
                    best_speaker = speaker

            if best_speaker not in speaker_map:
                keys = list(SPEAKER_LABELS.keys())
                speaker_map[best_speaker] = SPEAKER_LABELS.get(
                    keys[label_idx % len(keys)], f"Speaker {label_idx}"
                )
                label_idx += 1

            updated = dict(seg)
            updated["speaker"] = speaker_map[best_speaker]
            result.append(updated)
        return result

    def _alternate_speakers(self, segments: list[dict]) -> list[dict]:
        """Fallback: alternate agent/customer by segment order."""
        labels = [
            "Speaker A (Agent)",
            "Speaker B (Customer)",
        ]
        result = []
        for i, seg in enumerate(segments):
            updated = dict(seg)
            updated["speaker"] = labels[i % 2]
            result.append(updated)
        return result
