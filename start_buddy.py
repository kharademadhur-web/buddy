#!/usr/bin/env python3
"""
Buddy AI Assistant - Phi-1.5 FastAPI Server (Fixed Version)
"""

import os
import warnings
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# ===== 1. Suppress Warnings =====
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
warnings.filterwarnings("ignore")

# ===== 2. FastAPI Setup =====
class ChatRequest(BaseModel):
    text: str

app = FastAPI(title="Buddy AI", docs_url=None, redoc_url=None)

# ===== 3. Load Phi-1.5 Manually =====
print("🚀 Initializing Buddy AI...")

try:
    tokenizer = AutoTokenizer.from_pretrained("microsoft/phi-1_5")
    model = AutoModelForCausalLM.from_pretrained("microsoft/phi-1_5")
    model.eval()  # inference only
    print("✅ Buddy is ready!")
except Exception as e:
    print(f"❌ Model loading failed: {e}")
    raise

# ===== 4. Chat Endpoint =====
@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        prompt = f"User: {request.text}\nBuddy:"
        inputs = tokenizer(prompt, return_tensors="pt")
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_length=150,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                pad_token_id=tokenizer.eos_token_id
            )
        response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        reply = response_text.split("Buddy:")[-1].strip()
        return {
            "response": reply,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== 5. Run Silent Server =====
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        workers=1,
        log_level="error",
        access_log=False,
        server_header=False
    )
