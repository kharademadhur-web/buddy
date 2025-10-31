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

# CORS from env or default
_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:4173")
origins = [o.strip() for o in _origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
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
