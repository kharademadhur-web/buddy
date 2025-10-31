from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import logging

from app.config import settings
from app.database import engine, Base
from app.routers import health, auth, chat, notes
from app.routers import conversations as conversations_router
from app.routers import emotion as emotion_router
from app.middleware.rate_limiter import RateLimiter
from app.services.groq_service import GroqService
from app.services.openrouter_service import OpenRouterService

logging.basicConfig(
    level=getattr(logging, (settings.LOG_LEVEL or 'INFO').upper(), logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(settings.LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Buddy AI Assistant...")
    Base.metadata.create_all(bind=engine)
    # Initialize providers (OpenRouter primary if configured, Groq fallback)
    app.state.openrouter = OpenRouterService() if settings.openrouter_api_key else None
    app.state.groq = GroqService() if settings.groq_api_key else None

    app.state.phi2 = None
    if str(getattr(settings, 'USE_LOCAL_PHI2', 'false')).lower() == 'true':
        try:
            from app.services.phi2_service import Phi2Service  # lazy import to avoid heavy deps when disabled
            app.state.phi2 = Phi2Service()
        except Exception as e:
            logger.warning(f"Phi-2 not enabled (dependency missing or error): {e}")

    if app.state.openrouter:
        logger.info("OpenRouter (DeepSeek) initialized (Primary AI)")
    if app.state.groq:
        logger.info("Groq initialized (Fallback AI)")
    if app.state.phi2:
        logger.info("Local Phi-2 initialized (Emotion Analysis)")
    yield
    logger.info("Shutting down Buddy AI Assistant...")

app = FastAPI(
    title="Buddy AI Assistant API",
    description="Emotionally intelligent note organization and conversational AI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

origins_str = getattr(settings, 'ALLOWED_ORIGINS', None) or getattr(settings, 'allowed_origins', 'http://localhost:5173,http://localhost:4173')
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins_str.split(',') if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RateLimiter, max_requests=int(settings.RATE_LIMIT_PER_MINUTE), time_window=60)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    logger.info(f"→ {request.method} {request.url.path}")
    resp = await call_next(request)
    logger.info(f"← {resp.status_code} {request.url.path} ({time.time()-start:.2f}s)")
    return resp

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error", "type": "server_error"})

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(notes.router)
app.include_router(conversations_router.router)
app.include_router(emotion_router.router)

@app.get("/")
async def root():
    return {"name": "Buddy AI Assistant API", "version": "1.0.0", "status": "operational", "docs": "/docs", "health": "/api/health"}
