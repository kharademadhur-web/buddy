#!/usr/bin/env python3
"""
Full Buddy AI Assistant with ONNX, FastAPI, Voice, Sentiment, and Math
"""

import os
import re
import time
import warnings
import threading
from typing import Optional
from collections import deque
from functools import wraps

import numpy as np

# IMPORTANT: If you encounter a DLL loading error (OSError: [WinError 1114]), it's likely due to a corrupted PyTorch installation or a conflict.
# To fix this, please run the following commands in your terminal to reinstall torch and related libraries:
# pip uninstall torch torchvision torchaudio -y
# While reinstalling, please make sure you install the correct version for your CUDA (GPU) if you have one, or the CPU version if not.
# For CPU only: pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
# For CUDA 12.1: pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
# (Replace cu121 with your CUDA version if different. Check https://pytorch.org/get-started/locally/ for more options)

# Optional imports with error handling
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("Warning: redis not installed")

try:
    import keyboard
except ImportError:
    print("Warning: keyboard not installed")

try:
    import speech_recognition as sr
except ImportError:
    print("Warning: speech_recognition not installed")

try:
    from gtts import gTTS
    from pydub import AudioSegment
    from pydub.playback import play
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False
    print("Warning: gtts/pydub not installed")

try:
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel
    API_AVAILABLE = True
except ImportError:
    API_AVAILABLE = False
    print("Warning: fastapi not installed")

try:
    from transformers import AutoTokenizer, pipeline
    from optimum.onnxruntime import ORTModelForCausalLM
    from sentence_transformers import SentenceTransformer
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    print("Warning: transformers/optimum/sentence-transformers not installed")

# ========== Suppress Logs & CUDA ==========
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
warnings.filterwarnings("ignore")

# ========== Configuration ==========
MODEL_NAME = "microsoft/phi-1_5"
SENTIMENT_MODEL = "distilbert-base-uncased-finetuned-sst-2-english"
SIMILARITY_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
MAX_HISTORY = 5
CACHE_TTL = 3600
RESPONSE_TIME_TARGET = 3

# ========== FastAPI & Redis ==========
if API_AVAILABLE:
    app = FastAPI()
else:
    app = None

if REDIS_AVAILABLE:
    try:
        redis_client = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)
        redis_client.ping()
    except Exception as e:
        print(f"Redis connection failed: {e}")
        redis_client = None
else:
    redis_client = None

if API_AVAILABLE:
    class Query(BaseModel):
        text: str
        use_cache: Optional[bool] = True

# ========== BuddyCore Class ==========
class BuddyCore:
    def __init__(self):
        self.device = "cpu"
        self.response_history = deque(maxlen=MAX_HISTORY)
        self.similarity_threshold = 0.82
        self.models_loaded = False
        if ML_AVAILABLE:
            self.load_models()
        else:
            print("ML libraries not available. Running in limited mode.")

    def load_models(self):
        if not ML_AVAILABLE:
            print("ML libraries not available")
            return
        
        print("🚀 Initializing Buddy AI...")
        start = time.time()

        try:
            print("🧠 Loading Phi-1.5 ONNX...")
            self.tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
            self.model = ORTModelForCausalLM.from_pretrained(
                MODEL_NAME,
                provider="CPUExecutionProvider",
                use_io_binding=True
            )

            print("💬 Loading sentiment pipeline...")
            self.sentiment_pipeline = pipeline(
                "text-classification",
                model=SENTIMENT_MODEL,
                device=-1
            )

            print("🧠 Loading similarity engine...")
            self.similarity_model = SentenceTransformer(SIMILARITY_MODEL)

            self.models_loaded = True
            print(f"✅ Buddy ready in {time.time() - start:.2f}s")
        except Exception as e:
            print(f"Error loading models: {e}")
            self.models_loaded = False

    @staticmethod
    def cache_response(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            if redis_client and kwargs.get("use_cache", True):
                key = f"buddy:{args[0]}"
                try:
                    cached = redis_client.get(key)
                    if cached:
                        return cached if isinstance(cached, str) else cached.decode()
                except Exception as e:
                    print(f"Cache read error: {e}")
            result = func(self, *args, **kwargs)
            if redis_client:
                try:
                    redis_client.setex(key, CACHE_TTL, result)
                except Exception as e:
                    print(f"Cache write error: {e}")
            return result
        return wrapper

    @cache_response
    def generate_response(self, user_input, use_cache=True):
        if not self.models_loaded:
            return "Models not loaded. Please install required dependencies."
        
        prompt = f"""You are Buddy, an AI assistant.
Respond clearly, helpfully, and concisely.

User: {user_input}
Buddy:"""

        try:
            inputs = self.tokenizer(prompt, return_tensors="np")
            outputs = self.model.generate(
                **inputs,
                max_length=100,
                temperature=0.2,
                top_p=0.9,
                repetition_penalty=1.1
            )

            decoded = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            reply = decoded.split("Buddy:")[-1].strip().split("\n")[0]
            reply = self.post_process_response(reply)
            return reply
        except Exception as e:
            print(f"Generation error: {e}")
            return "Error generating response."

    def post_process_response(self, reply):
        if self.models_loaded and self.response_history:
            try:
                embeddings = self.similarity_model.encode([reply] + list(self.response_history))
                sim = np.dot(embeddings[0], embeddings[1:].T)
                if np.max(sim) > self.similarity_threshold:
                    return "Let me rephrase that clearly 😊..."
            except Exception as e:
                print(f"Similarity check error: {e}")
        
        reply = re.sub(r"\b(sex|hate|violence)\b", "[filtered]", reply, flags=re.IGNORECASE)
        self.response_history.append(reply)
        return reply

    def voice_input(self):
        recognizer = sr.Recognizer()
        with sr.Microphone() as source:
            print("🎙️ Listening...")
            audio = recognizer.listen(source, timeout=5)
        try:
            return recognizer.recognize_google(audio)
        except:
            return ""

    def math_assistant(self, expr):
        try:
            result = eval(expr, {"__builtins__": {}})
            return f"🧮 Result: {result}"
        except:
            return "❌ Invalid math expression"

    def speak(self, text):
        if not TTS_AVAILABLE:
            print("TTS not available")
            return
        try:
            tts = gTTS(text)
            tts.save("temp.mp3")
            audio = AudioSegment.from_mp3("temp.mp3")
            play(audio)
            os.remove("temp.mp3")
        except Exception as e:
            print(f"TTS error: {e}")

# ========== Initialize ==========
buddy = BuddyCore() if ML_AVAILABLE else None

# ========== FastAPI Route ==========
if API_AVAILABLE and app:
    @app.post("/chat")
    async def chat_endpoint(query: Query):
        try:
            if not buddy:
                raise HTTPException(status_code=503, detail="Buddy not initialized")
            reply = buddy.generate_response(query.text, use_cache=query.use_cache)
            return {"response": reply}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

# ========== CLI Interface ==========
def cli_interface():
    print("\n🌟 Buddy AI Assistant 🌟")
    print("Choose mode:\n1. Voice Input\n2. Text Input")
    choice = input("Select (1/2): ").strip()

    while True:
        try:
            if choice == "1":
                user_input = buddy.voice_input()
                if not user_input:
                    print("❌ Could not hear you")
                    continue
                print(f"You: {user_input}")
            else:
                user_input = input("\nYou: ").strip()

            if user_input.lower() in ["exit", "quit"]:
                print("👋 Bye Madhur!")
                break

            if re.match(r"^[\d\s+\-*/().]+$", user_input):
                print(buddy.math_assistant(user_input))
            else:
                reply = buddy.generate_response(user_input)
                print(f"Buddy: {reply}")
                buddy.speak(reply)

        except KeyboardInterrupt:
            print("\n👋 Interrupted. Exiting.")
            break

# ========== Entry ==========
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "api":
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)
    else:
        cli_interface()
