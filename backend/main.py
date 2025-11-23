from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.routers import health, notes
try:
    from app.routers import auth, chat, conversations, emotion, voice
except Exception:
    # Some routers may be optional depending on workspace; import safely
    auth = chat = conversations = emotion = voice = None

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Note Organization Assistant", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(notes.router)
if auth is not None:
    try:
        app.include_router(auth.router)
    except Exception:
        pass
if chat is not None:
    try:
        app.include_router(chat.router)
    except Exception:
        pass
if conversations is not None:
    try:
        app.include_router(conversations.router)
    except Exception:
        pass
if emotion is not None:
    try:
        app.include_router(emotion.router)
    except Exception:
        pass
if voice is not None:
    try:
        app.include_router(voice.router)
    except Exception:
        pass
