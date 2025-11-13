from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/

class Settings(BaseSettings):
    database_url: str = Field(default="sqlite:///buddy_notes.db", alias="DATABASE_URL")

    # OpenRouter (DeepSeek) primary
    openrouter_api_key: str | None = Field(default=None, alias="OPENROUTER_API_KEY")
    openrouter_model: str = Field(default="deepseek/deepseek-chat", alias="OPENROUTER_MODEL")
    openrouter_base_url: str = Field(default="https://openrouter.ai/api/v1", alias="OPENROUTER_BASE_URL")

    # Groq fallback
    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    groq_model: str = Field(default="llama-3.1-8b-instant", alias="GROQ_MODEL")

    # Local models
    phi2_model_path: str | None = Field(default=None, alias="PHI2_MODEL_PATH")

    # App
    allowed_origins: str = Field(default="http://localhost:5173,http://localhost:4173", alias="ALLOWED_ORIGINS")
    google_audience: str | None = Field(default=None, alias="GOOGLE_AUDIENCE")
    google_client_id: str | None = Field(default=None, alias="GOOGLE_CLIENT_ID")
    google_client_secret: str | None = Field(default=None, alias="GOOGLE_CLIENT_SECRET")
    debug: bool = Field(default=True, alias="DEBUG")

    # AI params
    GROQ_MAX_TOKENS: int = Field(default=1024)
    GROQ_TEMPERATURE: float = Field(default=0.7)

    # Auth
    SECRET_KEY: str = Field(default="change-this-in-production")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)

    # Rate limiting / logging
    RATE_LIMIT_PER_MINUTE: int = Field(default=100)
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FILE: str = Field(default="buddy_ai.log")

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        case_sensitive=True,
        populate_by_name=True,
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        s = (self.allowed_origins or "").strip()
        if not s:
            return ["*"]
        return [o.strip() for o in s.split(",") if o.strip()]

settings = Settings()
