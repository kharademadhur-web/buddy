"""
Minimal, robust FastAPI entrypoint that always imports on PaaS (Render/Vercel).
Keeps the service booting even if optional modules fail to import.
"""
from __future__ import annotations

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create app
app = FastAPI(title="Buddy AI Assistant API", version="1.0.0")

# CORS from env or default (include common hosting domains)
_default_origins = ",".join([
    "http://localhost:5173",
    "http://localhost:4173",
    "https://buddy-frontend.kharademadhur.workers.dev",
])
_origins = os.environ.get("ALLOWED_ORIGINS", _default_origins)
origins = [o.strip() for o in _origins.split(",") if o.strip()]
# Also allow regex to match dynamic preview domains while keeping credentials working
origin_regex = os.environ.get("CORS_ALLOW_ORIGIN_REGEX", r"https?://.*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "name": "Buddy AI Assistant API",
        "version": "1.0.0",
        "status": "ok",
        "docs": "/docs",
        "health": "/api/health",
    }

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

# Try to include real routers if available; ignore errors so boot succeeds
try:
    from app.routers import auth, chat, notes
    from app.routers import conversations as conversations_router
    from app.routers import emotion as emotion_router

    for mod in (auth, chat, notes, conversations_router, emotion_router):
        try:
            app.include_router(mod.router)
        except Exception as e:  # pragma: no cover
            print(f"[startup] Skipped router {getattr(mod, '__name__', mod)}: {e}")
except Exception as e:  # pragma: no cover
    print(f"[startup] Routers not loaded: {e}")

# Fallback minimal endpoints if routers are unavailable (avoid 404s)
from fastapi import Body
from typing import Any, Dict

def _route_exists(path: str, method: str = "GET") -> bool:
    try:
        for r in app.router.routes:
            if getattr(r, "path", None) == path and method in getattr(r, "methods", set([method])):
                return True
    except Exception:
        pass
    return False

if not _route_exists("/api/conversations", "GET"):
    @app.get("/api/conversations")
    def _fallback_conversations() -> list[dict]:
        return []

if not _route_exists("/api/chat/", "POST"):
    @app.post("/api/chat/")
    async def _fallback_chat(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
        text = payload.get("message") or payload.get("text") or ""
        return {
            "response": ("Buddy backend is initializing. "
                          "Please try again in a moment." if not text else f"You said: {text}"),
            "emotion": None,
            "conversation_id": payload.get("conversation_id") or "new",
            "model": "placeholder"
        }
