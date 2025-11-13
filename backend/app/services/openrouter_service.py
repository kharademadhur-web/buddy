from openai import OpenAI
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class OpenRouterService:
    """OpenRouter (DeepSeek) API service via OpenAI SDK."""
    def __init__(self):
        if not settings.openrouter_api_key:
            self.client = None
        else:
            self.client = OpenAI(base_url=settings.openrouter_base_url, api_key=settings.openrouter_api_key)
        self.model = settings.openrouter_model
        logger.info(f"OpenRouter service initialized with model: {self.model}")

    async def chat_completion(self, messages: list, stream: bool = False):
        if not self.client:
            raise RuntimeError("OPENROUTER_API_KEY not configured")
        resp = self.client.chat.completions.create(model=self.model, messages=messages, stream=stream)
        if stream:
            return resp
        return resp.choices[0].message.content

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
