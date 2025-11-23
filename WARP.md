# Project Rules (Warp)

- Root: D:\Madhur\ai_assistant_project
- Frontend: `frontend/` (Vite React)
- Backend: `backend/` (FastAPI)

## Runbooks
- Backend (dev): `python -m uvicorn main:app --app-dir backend --reload --port 8000`
- Frontend (dev): `cd frontend && npm run dev`
- Build/Preview: `cd frontend && npm run build && npm run preview`

## Env
- Root `.env` (copy from `.env.example`)
- Backend `backend/.env`

## Agent tasks
- Implement note org endpoint in `backend/app/routers/notes.py`
- Enhance topic extraction in `backend/app/services/nlp.py`
- Add file watcher in `backend/scripts/watch_notes.py` (use watchdog)
