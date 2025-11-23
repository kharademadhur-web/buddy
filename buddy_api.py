#!/usr/bin/env python3
"""
Optimized Buddy API - Fixed Version
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import time
import re
from collections import deque
import numpy as np
from functools import wraps
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("Warning: Redis not available. Caching disabled.")

try:
    from phi_inference import PhiInference
    PHI_AVAILABLE = True
except ImportError:
    PHI_AVAILABLE = False
    print("Warning: PhiInference not available. Using fallback.")

# Configuration
MAX_HISTORY = 5
CACHE_TTL = 3600  # 1 hour

app = FastAPI()
if REDIS_AVAILABLE:
    try:
        r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
        r.ping()  # Test connection
    except Exception as e:
        print(f"Redis connection failed: {e}. Caching disabled.")
        r = None
else:
    r = None

class Query(BaseModel):
    text: str
    use_cache: Optional[bool] = True

class BuddyAPI:
    def __init__(self):
        if PHI_AVAILABLE:
            self.phi = PhiInference()
        else:
            self.phi = None
        self.response_history = deque(maxlen=MAX_HISTORY)

    @staticmethod
    def cache_response(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            if r and kwargs.get('use_cache', True):
                cache_key = f"buddy:{args[0]}"
                try:
                    cached = r.get(cache_key)
                    if cached:
                        return cached if isinstance(cached, str) else cached.decode()
                except Exception as e:
                    print(f"Cache read error: {e}")
            result = func(self, *args, **kwargs)
            if r:
                try:
                    r.setex(cache_key, CACHE_TTL, result)
                except Exception as e:
                    print(f"Cache write error: {e}")
            return result
        return wrapper

    @cache_response
    def generate_response(self, user_input: str, use_cache: bool = True):
        start_time = time.time()
        
        # Generate response
        if self.phi:
            response = self.phi.generate(
                user_input,
                max_length=100,
                temperature=0.2,
                top_p=0.8
            )
        else:
            response = "PhiInference not available. Please check dependencies."
        
        # Post-processing
        response = self._post_process(response)
        print(f"Response time: {time.time() - start_time:.2f}s")
        return response

    def _post_process(self, text):
        text = re.sub(r"(?i)\b(sex|hate|violence)\b", "[filtered]", text)
        return text

# Initialize at startup
buddy = BuddyAPI()

@app.post("/chat")
async def chat_endpoint(query: Query):
    try:
        response = buddy.generate_response(query.text, use_cache=query.use_cache)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)