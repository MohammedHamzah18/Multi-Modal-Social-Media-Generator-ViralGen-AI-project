# Deployment Guide — Render (Backend) + Vercel (Frontend)

## Architecture

```
┌─────────────────┐     HTTPS      ┌──────────────────────┐
│  Vercel (React) │ ─────────────► │  Render (FastAPI)    │
│  Static + SPA   │   REST API     │  + PostgreSQL        │
└─────────────────┘                └──────────────────────┘
```

---

## Part 1: Deploy Backend on Render

### Option A: Blueprint (`render.yaml`)

1. Push the repo to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**.
3. Connect the repository — Render reads `render.yaml` at the project root.
4. Set **OPENAI_API_KEY** when prompted (sync: false).
5. Update `CORS_ORIGINS` to your Vercel URL after frontend deploy.

### Option B: Manual Web Service

1. **New → Web Service** → connect GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Docker (or Python)
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **New → PostgreSQL** database on Render.
4. Link `DATABASE_URL` — convert to async format:

```
postgresql+asyncpg://USER:PASS@HOST/DATABASE
```

(Render's default URL uses `postgresql://` — replace the scheme with `postgresql+asyncpg://`.)

5. Environment variables:

| Key | Value |
|-----|-------|
| `SECRET_KEY` | Generate random 64-char hex |
| `OPENAI_API_KEY` | Your OpenAI key |
| `DATABASE_URL` | `postgresql+asyncpg://...` |
| `CORS_ORIGINS` | `https://your-app.vercel.app` |
| `ENABLE_PYANNOTE` | `false` (recommended on free tier) |

6. Add a **Disk** (optional) for persistent uploads, mount at `/app/uploads`.

7. Health check path: `/health`

Note your API URL: `https://voiceops-sentinel-api.onrender.com`

---

## Part 2: Deploy Frontend on Vercel

1. Push code to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project**.
3. Import the repository.
4. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Environment variable:

```
VITE_API_URL=https://your-render-service.onrender.com/api/v1
```

6. Deploy.

7. Update Render `CORS_ORIGINS` to include your Vercel URL:

```
https://your-app.vercel.app,https://your-app-*.vercel.app
```

---

## Part 3: Post-Deployment Checklist

- [ ] Visit `https://your-api.onrender.com/health` — returns `healthy`
- [ ] Visit `https://your-api.onrender.com/docs` — Swagger loads
- [ ] Register user on Vercel frontend
- [ ] Upload test MP3/WAV
- [ ] Confirm processing completes (may take 1–3 min on cold start)
- [ ] Test PDF export and search

---

## Production Recommendations

1. **Secrets:** Never commit `.env` files. Use Render/Vercel secret managers.
2. **HTTPS:** Both platforms provide TLS by default.
3. **File storage:** For production scale, replace local `uploads/` with S3/R2 and store URLs in the database.
4. **Background jobs:** For heavy processing, add Redis + Celery or Render background workers.
5. **Rate limiting:** Add `slowapi` or API gateway limits.
6. **Monitoring:** Enable Render metrics; add Sentry for error tracking.

---

## Docker Production Build (self-hosted)

```bash
docker compose -f docker-compose.yml up -d --build
```

Use a reverse proxy (Nginx/Caddy) with TLS in front of ports 8000 and 5173.

---

## CI/CD (optional)

**GitHub Actions — frontend to Vercel:** Vercel auto-deploys on push.

**GitHub Actions — backend to Render:** Enable Render auto-deploy on main branch.

Example Vercel CLI:

```bash
cd frontend
npm i -g vercel
vercel --prod
```

Example Render deploy hook: use Render's deploy hook URL in GitHub Actions `curl` step after tests pass.
