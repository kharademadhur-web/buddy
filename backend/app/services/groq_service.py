from groq import Groq
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class GroqService:
    """Groq API service for ultra-fast LLM inference"""
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
        self.model = settings.GROQ_MODEL
        logger.info(f"Groq service initialized with model: {self.model}")

    async def chat_completion(self, messages: list, stream: bool = False):
        if not self.client:
            raise RuntimeError("GROQ_API_KEY not configured")
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=float(settings.GROQ_TEMPERATURE),
                max_tokens=int(settings.GROQ_MAX_TOKENS),
                stream=stream,
            )
            if stream:
                return resp
            return resp.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            raise

    async def extract_topics(self, text: str) -> list[str]:
        prompt = (
            "Analyze this note and extract 3-5 main topics/themes.\n"
            "Return ONLY a comma-separated list of topics, nothing else.\n\n"
            f"Note: {text[:1000]}"
        )
        messages = [{"role": "user", "content": prompt}]
        res = await self.chat_completion(messages)
        return [t.strip() for t in (res or '').split(',')][:5]

    async def generate_headings(self, text: str) -> list[dict]:
        prompt = (
            "Analyze this note and create a hierarchical outline with headings.\n"
            "Return JSON array: [{\"level\": 1-3, \"text\": \"heading\"}]\n\n"
            f"Note: {text[:2000]}"
        )
        messages = [{"role": "user", "content": prompt}]
        res = await self.chat_completion(messages)
        import json
        try:
            return json.loads(res or '[]')
        except Exception:
            return [{"level": 1, "text": "Main Content"}]

    async def categorize_note(self, text: str) -> list[str]:
        prompt = (
            "Categorize this note into 1-3 categories from: "
            "[Work, Personal, Study, Ideas, Tasks, Reference, Meeting, Project]\n"
            "Return ONLY category names comma-separated.\n\n"
            f"Note: {text[:800]}"
        )
        messages = [{"role": "user", "content": prompt}]
        res = await self.chat_completion(messages)
        return [c.strip() for c in (res or '').split(',')][:3]
