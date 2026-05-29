# VoiceOps Sentinel

**Real-Time Call Intelligence System** — An enterprise-grade platform that processes customer support call recordings with AI-powered transcription, speaker diarization, sentiment analysis, PII redaction, summarization, and action item extraction.

![Stack](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

---

## Features

| Module | Capabilities |
|--------|-------------|
| **Audio Upload** | MP3, WAV, FLAC — drag-and-drop, progress bar, playback |
| **Transcription** | OpenAI Whisper API with timestamped segments |
| **Diarization** | Pyannote (optional) — Agent vs Customer chat view |
| **Sentiment** | Positive / Neutral / Negative timeline + overall score |
| **Summarization** | Executive summary + key discussion points |
| **Action Items** | Auto-extracted tasks with priority and assignee |
| **PII Redaction** | Microsoft Presidio — original vs redacted views |
| **Dashboard** | Analytics charts, recent calls, KPI cards |
| **Search** | Full-text transcript search |
| **Export** | Download transcript/summary as PDF |
| **Auth** | JWT + role-based access (Admin, Analyst, Viewer) |
| **Notifications** | Processing completion alerts |

---

## Screenshots & UI

- Glassmorphism SaaS dashboard
- Light / dark mode
- Responsive sidebar navigation
- Recharts analytics
- Skeleton loaders & Framer Motion animations

---

## Project Structure

```
voiceops-sentinel/
├── backend/
│   ├── app/
│   │   ├── api/v1/routes/     # REST endpoints
│   │   ├── core/              # Config, DB, security, deps
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic DTOs
│   │   ├── services/          # AI & processing pipeline
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # UI, layout, calls
│   │   ├── context/           # Auth, theme
│   │   ├── pages/             # Route pages
│   │   └── api/               # Axios client
│   └── package.json
├── docs/
│   ├── INSTALLATION.md
│   └── DEPLOYMENT.md
├── docker-compose.yml
└── render.yaml
```

---

## Quick Start

```bash
# 1. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Set OPENAI_API_KEY in backend/.env

# 2. Run with Docker
docker compose up --build

# 3. Open http://localhost:5173 and register
```

See [docs/INSTALLATION.md](docs/INSTALLATION.md) for detailed setup.

---

## API Documentation

With the backend running, visit:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Health:** http://localhost:8000/health

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | JWT login |
| POST | `/api/v1/calls` | Upload audio (multipart) |
| GET | `/api/v1/calls/{id}` | Full call intelligence |
| GET | `/api/v1/dashboard/stats` | Analytics |
| GET | `/api/v1/calls/search?q=` | Search transcripts |

---

## Tech Stack

**Backend:** Python 3.11, FastAPI, SQLAlchemy 2 (async), PostgreSQL, OpenAI (Whisper + GPT), Presidio, Pyannote (optional), ReportLab

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion, React Router, Axios

**DevOps:** Docker Compose, Render, Vercel

---

## Database Schema

- `users` — authentication & RBAC
- `calls` — audio metadata & processing status
- `transcripts` — segments, speakers, redacted text
- `summaries` — executive summary & key points
- `action_items` — extracted tasks
- `sentiment_analysis` — timeline & scores
- `notifications` — user alerts

---

## Deployment

Deploy backend to **Render** and frontend to **Vercel**:

👉 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## Demo Mode

Without an OpenAI API key, the backend serves realistic **demo transcripts** and analysis so you can explore the UI immediately. Add `OPENAI_API_KEY` for production-quality results.

---

## License

MIT — suitable for portfolio and educational use.

---

## Author

Built as a portfolio-grade full-stack AI application demonstrating modern enterprise architecture, clean code, and production deployment patterns.
