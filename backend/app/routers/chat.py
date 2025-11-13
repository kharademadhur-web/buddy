from fastapi import APIRouter, Request, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import json
from app.schemas.chat import ChatRequest, ChatResponse
from app.database import SessionLocal
from app.models.conversation import Conversation
from app.models.message import Message

router = APIRouter(prefix="/api/chat", tags=["chat"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


from app.utils.auth import get_current_user
from app.models.user import User

@router.post("/", response_model=ChatResponse)
async def chat(payload: ChatRequest, req: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    llm = getattr(req.app.state, 'openrouter', None) or getattr(req.app.state, 'groq', None)
    phi2 = getattr(req.app.state, 'phi2', None)

    messages = [
        {"role": "system", "content": "You are Buddy, a warm and helpful AI assistant."},
        {"role": "user", "content": payload.message}
    ]

    # Persist conversation/messages (even when llm is unavailable)
    conv_id = None
    if payload.conversation_id and str(payload.conversation_id).isdigit():
        conv_id = int(payload.conversation_id)
    else:
        conv = Conversation(user_id=None)
        db.add(conv)
        db.commit()
        db.refresh(conv)
        conv_id = conv.id

    db.add(Message(conversation_id=conv_id, role='user', content=payload.message))
    db.commit()

    # Generate response with best-effort fallbacks
    response_text = ""
    try:
        if llm and getattr(llm, 'chat_completion', None):
            response_text = await llm.chat_completion(messages)
        else:
            response_text = f"You said: {payload.message}"
    except Exception:
        # Avoid 500s in dev when keys are missing; return echo response
        response_text = f"You said: {payload.message}"

    emotion = None
    try:
        if phi2 and payload.detect_emotion:
            emotion = phi2.detect_emotion(payload.message)
    except Exception:
        emotion = None

    db.add(Message(conversation_id=conv_id, role='assistant', content=response_text))
    db.commit()

    model_name = getattr(llm, 'model', 'unavailable') if llm else 'unavailable'
    return ChatResponse(
        response=response_text,
        emotion=emotion,
        conversation_id=str(conv_id),
        model=model_name
    )

@router.post("/stream")
async def chat_stream(payload: ChatRequest, req: Request):
    llm = req.app.state.openrouter or req.app.state.groq

    messages = [
        {"role": "system", "content": "You are Buddy, a helpful AI assistant."},
        {"role": "user", "content": payload.message}
    ]

    async def generate():
        if not llm:
            yield f"data: {json.dumps({'error':'LLM provider not configured'})}\n\n"
            return
        stream = await llm.chat_completion(messages, stream=True)
        for chunk in stream:
            delta = getattr(chunk.choices[0], 'delta', None)
            token = getattr(delta, 'content', None) if delta else None
            if token:
                yield f"data: {json.dumps({'token': token})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
