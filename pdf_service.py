"""PDF export for transcripts and summaries."""

import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


def _styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="Header",
            parent=styles["Heading1"],
            fontSize=18,
            textColor=colors.HexColor("#1e3a5f"),
            spaceAfter=12,
        )
    )
    return styles


def generate_transcript_pdf(
    title: str,
    segments: list[dict],
    redacted: bool = False,
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75 * inch)
    styles = _styles()
    story = [
        Paragraph(f"VoiceOps Sentinel — Transcript", styles["Header"]),
        Paragraph(f"<b>Call:</b> {title}", styles["Normal"]),
        Paragraph(
            f"<b>Generated:</b> {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
            styles["Normal"],
        ),
        Paragraph(
            f"<b>View:</b> {'Redacted' if redacted else 'Original'}",
            styles["Normal"],
        ),
        Spacer(1, 0.25 * inch),
    ]
    for seg in segments:
        speaker = seg.get("speaker", "Unknown")
        start = seg.get("start", 0)
        end = seg.get("end", 0)
        text = seg.get("text", "")
        line = (
            f"<b>[{start:.1f}s - {end:.1f}s] {speaker}:</b> "
            f"{text.replace('&', '&amp;').replace('<', '&lt;')}"
        )
        story.append(Paragraph(line, styles["Normal"]))
        story.append(Spacer(1, 0.1 * inch))
    doc.build(story)
    buffer.seek(0)
    return buffer.read()


def generate_summary_pdf(title: str, summary: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75 * inch)
    styles = _styles()
    story = [
        Paragraph("VoiceOps Sentinel — Executive Summary", styles["Header"]),
        Paragraph(f"<b>Call:</b> {title}", styles["Normal"]),
        Spacer(1, 0.2 * inch),
        Paragraph("<b>Executive Summary</b>", styles["Heading2"]),
        Paragraph(summary.get("executive_summary", ""), styles["Normal"]),
        Spacer(1, 0.2 * inch),
        Paragraph("<b>Key Discussion Points</b>", styles["Heading2"]),
    ]
    for point in summary.get("key_points", []):
        story.append(Paragraph(f"• {point}", styles["Normal"]))
        story.append(Spacer(1, 0.05 * inch))
    doc.build(story)
    buffer.seek(0)
    return buffer.read()
