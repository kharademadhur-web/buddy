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
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "https://buddy-frontend.kharademadhur.workers.dev",
    "https://papaya-bublanina-afa881.netlify.app",
    "https://classy-begonia-426c14.netlify.app",
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

# Auth middleware & DB init
try:
    from app.middleware.auth import AuthMiddleware
    app.add_middleware(AuthMiddleware)
except Exception as e:
    print(f"[startup] Auth middleware not loaded: {e}")

try:
    from app.database import Base, engine  # type: ignore
    from app.models import user as _user, note as _note, conversation as _conv, message as _msg  # ensure models imported
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[startup] DB init failed: {e}")

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

# Try to include real routers if available; import each independently so one failure doesn't block others
from importlib import import_module

def _include_router(module_path: str, attr: str = "router"):
    try:
        mod = import_module(module_path)
        router_obj = getattr(mod, attr, None)
        if router_obj is not None:
            app.include_router(router_obj)
            print(f"[startup] Router loaded: {module_path}")
        else:
            print(f"[startup] No 'router' in {module_path}")
    except Exception as e:  # pragma: no cover
        print(f"[startup] Skipped router {module_path}: {e}")

_include_router("app.routers.auth")
_include_router("app.routers.chat")
_include_router("app.routers.notes")
_include_router("app.routers.conversations")
_include_router("app.routers.emotion")
_include_router("app.routers.voice")

# Initialize LLM services on startup
@app.on_event("startup")
async def startup_event():
    import logging
    log = logging.getLogger(__name__)
    try:
        from app.services.openrouter_service import OpenRouterService
        app.state.openrouter = OpenRouterService()
        if app.state.openrouter.client:
            log.info("✓ OpenRouter service initialized")
        else:
            app.state.openrouter = None
    except Exception as e:
        log.warning(f"OpenRouter init skipped: {e}")
        app.state.openrouter = None
    
    try:
        from app.services.groq_service import GroqService
        app.state.groq = GroqService()
        if app.state.groq.client:
            log.info("✓ Groq service initialized")
        else:
            app.state.groq = None
    except Exception as e:
        log.warning(f"Groq init skipped: {e}")
        app.state.groq = None
    
    try:
        from app.services.phi2_service import Phi2Service
        app.state.phi2 = Phi2Service()
        log.info("✓ Phi2 service initialized")
    except Exception as e:
        log.warning(f"Phi2 init skipped: {e}")
        app.state.phi2 = None

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

if not _route_exists("/api/chat/relief", "POST"):
    @app.post("/api/chat/relief")
    async def _fallback_chat_relief(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
        text = payload.get("message") or payload.get("text") or ""
        save_memory = payload.get("save_memory", True)
        response_text = "I'm here to listen. " + (f"You mentioned: {text}. " if text else "") + "Tell me more about how you're feeling."
        return {
            "response": response_text,
            "emotion": None,
            "conversation_id": payload.get("conversation_id") or "private",
            "model": "placeholder"
        }
