# Installation Guide — VoiceOps Sentinel

## Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- **PostgreSQL 16+** (or Docker)
- **FFmpeg** (for audio processing)
- **OpenAI API key** (Whisper + GPT summarization)

Optional:

- **HuggingFace token** — for Pyannote speaker diarization
- **Docker & Docker Compose** — recommended for local development

---

## Quick Start with Docker

1. Clone the repository and enter the project folder.

2. Copy environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Edit `backend/.env` and set at minimum:

```env
OPENAI_API_KEY=sk-your-key-here
SECRET_KEY=your-random-secret
```

4. Start all services:

```bash
docker compose up --build
```

5. Open the application:

| Service   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:5173        |
| Backend   | http://localhost:8000        |
| API Docs  | http://localhost:8000/docs   |

6. Register a new account at `/register`, then upload a call from **Upload**.

---

## Manual Installation

### 1. Database

Create a PostgreSQL database:

```sql
CREATE USER voiceops WITH PASSWORD 'voiceops';
CREATE DATABASE voiceops_sentinel OWNER voiceops;
```

### 2. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your DATABASE_URL and OPENAI_API_KEY

mkdir uploads
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Tables are created automatically on first startup via SQLAlchemy `create_all`.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL=http://localhost:8000/api/v1` in `frontend/.env`.

---

## Optional: Pyannote Speaker Diarization

1. Accept the model license on HuggingFace: `pyannote/speaker-diarization-3.1`
2. Create a token at https://huggingface.co/settings/tokens
3. Install Pyannote (large download):

```bash
pip install pyannote.audio
```

4. In `backend/.env`:

```env
HUGGINGFACE_TOKEN=hf_your_token
ENABLE_PYANNOTE=true
```

Without Pyannote, the system uses an alternating speaker heuristic (Agent/Customer).

---

## Optional: Presidio PII Redaction

Presidio is included in `requirements.txt`. On first run it downloads NLP models.

If Presidio fails, regex-based redaction is used automatically for emails, phones, and credit cards.

---

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Async PostgreSQL URL | localhost |
| `SECRET_KEY` | JWT signing key | (required in prod) |
| `OPENAI_API_KEY` | OpenAI API key | — |
| `CORS_ORIGINS` | Allowed frontend origins | localhost:5173 |
| `HUGGINGFACE_TOKEN` | Pyannote HF token | — |
| `ENABLE_PYANNOTE` | Enable diarization | false |
| `MAX_UPLOAD_SIZE_MB` | Max audio file size | 100 |
| `PRESIDIO_ENABLED` | Use Presidio for PII | true |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| DB connection refused | Ensure PostgreSQL is running and `DATABASE_URL` is correct |
| Whisper fails | Verify `OPENAI_API_KEY`; demo transcript used if missing |
| Upload 413 | Increase `MAX_UPLOAD_SIZE_MB` or use smaller files |
| CORS errors | Add frontend URL to `CORS_ORIGINS` |
| Audio won't play | Ensure you're logged in (Bearer token on API requests) |
