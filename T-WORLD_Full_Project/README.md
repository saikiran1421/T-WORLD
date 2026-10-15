# T-WORLD — Gamified Budget Travel Planner

A hackathon-ready full-stack MVP featuring a React + Vite frontend and a Python FastAPI backend.

## Features
- Trip generator with destination, duration, budget, and interests
- Budget breakdown and budget warning
- Simulated heavy-rain event that swaps outdoor activities for indoor alternatives
- XP, coins, badges, and quest completion
- AI Travel Buddy with a rule-based fallback (works without a paid AI key)
- Interactive adventure-style map panel (illustrative, not live navigation)
- LocalStorage persistence for the demo

> Prices, weather events, routes, and itineraries are estimates/demo simulations, not live booking or weather data.

## Project structure
- `frontend/` — React + Vite
- `backend/` — FastAPI API
- `render.yaml` — backend deployment blueprint

## Run locally

### 1. Backend
Python 3.10+ recommended.

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API: `http://127.0.0.1:8000`  
Interactive API docs: `http://127.0.0.1:8000/docs`

### 2. Frontend
Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will show the local URL (usually `http://localhost:5173`).

## Deploy backend on Render
1. Push this project to a GitHub repository.
2. In Render, choose **New + → Web Service** and connect the repository.
3. Set **Root Directory** to `backend`.
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. After deployment, copy the backend URL, e.g. `https://your-service.onrender.com`.

The included `render.yaml` can also be used as a Blueprint.

## Connect frontend to backend
In the GitHub repository, open `frontend/.env.production.example`, copy it to `frontend/.env.production`, and set:

```env
VITE_API_BASE_URL=https://your-service.onrender.com
```

Commit and push. For local development, create `frontend/.env.local` with:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Do not add private API keys to frontend environment variables.

## Deploy frontend
Recommended easy option: **Netlify** or **Vercel**:
- Build command: `npm run build`
- Publish directory: `dist`
- Base directory: `frontend`
- Set `VITE_API_BASE_URL` to the deployed Render backend URL.

GitHub Pages is also possible, but it only serves static frontend files and cannot run the Python API. For GitHub Pages, configure the Vite `base` path to your repository name if the asset paths fail.

## Optional real LLM API
The default chatbot is rule-based so the demo works without a paid key. To add a real LLM, implement it in the backend only and store the provider key as a Render environment secret. Never expose a secret in React code or commit it to GitHub.
