"""Audio file utilities for duration and validation."""

import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def get_audio_duration(file_path: Path) -> float | None:
    try:
        from pydub import AudioSegment

        ext = file_path.suffix.lower().lstrip(".")
        if ext == "mp3":
            audio = AudioSegment.from_mp3(file_path)
        elif ext == "wav":
            audio = AudioSegment.from_wav(file_path)
        elif ext == "flac":
            audio = AudioSegment.from_file(file_path, format="flac")
        else:
            audio = AudioSegment.from_file(file_path)
        return len(audio) / 1000.0
    except Exception as exc:
        logger.warning("Could not read audio duration: %s", exc)
        try:
            import librosa

            duration = librosa.get_duration(path=str(file_path))
            return float(duration)
        except Exception:
            return None
