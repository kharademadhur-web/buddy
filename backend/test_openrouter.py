import asyncio
import pytest
from app.config import settings

# Skip this integration test when the OpenRouter API key is not configured.
if not getattr(settings, "openrouter_api_key", None):
    pytest.skip("OpenRouter API key not set; skipping integration test", allow_module_level=True)

from app.services.openrouter_service import OpenRouterService


async def test():
    print(f"API Key set: {bool(settings.openrouter_api_key)}")
    print(f"Model: {settings.openrouter_model}")
    print(f"Base URL: {settings.openrouter_base_url}")

    service = OpenRouterService()
    print(f"Service client: {service.client}")

    messages = [
        {"role": "system", "content": "You are Buddy, a helpful AI."},
        {"role": "user", "content": "Say hello!"}
    ]

    try:
        response = await service.chat_completion(messages)
        print(f"✅ Response: {response}")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test())
