from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import json
from app.schemas.chat import ChatRequest, ChatResponse, ReliefChatRequest
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
from typing import Optional
# Create a dependency that allows optional authentication
async def optional_get_current_user(request: Request, db: Session = Depends(get_db)):
    try:
        return await get_current_user(request, db)
    except:
        # Return None if authentication fails
        return None

# Endpoints with authentication
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
    import logging
    logger = logging.getLogger(__name__)
    response_text = ""
    try:
        if llm and getattr(llm, 'chat_completion', None):
            logger.info(f"Calling LLM: {llm.__class__.__name__}")
            response_text = await llm.chat_completion(messages)
            if not response_text:
                logger.warning("LLM returned empty response")
                response_text = "I received your message but couldn't generate a response. Please try again."
        else:
            logger.warning("No LLM service available (llm is None or has no chat_completion method)")
            response_text = "Sorry, the AI service is not currently available. Please try again later."
    except Exception as e:
        # Log the actual error
        logger.error(f"LLM call failed: {str(e)}", exc_info=True)
        # Return a user-friendly message instead of just echoing
        response_text = f"I'm experiencing technical difficulties. Error: {str(e)[:100]}"

    emotion = None
    try:
        if phi2 and payload.detect_emotion:
            emotion = phi2.detect_emotion(payload.message)
    except Exception:
        emotion = None

    db.add(Message(conversation_id=conv_id, role='assistant', content=response_text))
    db.commit()

    # Automatic Note Generation (Family Tree / Key Info)
    # We'll use a background task or just fire-and-forget logic if possible, 
    # but for simplicity and reliability in this setup, we'll do it inline or via a helper.
    # To avoid blocking the response too long, we should ideally use BackgroundTasks.
    # But since I can't easily change the signature to add BackgroundTasks without potentially breaking other things (though I can),
    # I'll just do a quick check.
    
    try:
        # Only analyze if we have a valid conversation ID and response
        if conv_id and response_text and llm:
            # We need to get the conversation history to analyze context
            # But to save tokens, maybe just analyze the last few turns or the whole thing if short.
            # Let's define a helper function to do this asynchronously if possible, but here we are in an async function.
            
            # We'll trigger a "fire and forget" task effectively by not awaiting it? 
            # No, in asyncio we should create a task.
            import asyncio
            async def analyze_and_save_notes():
                try:
                    # Re-acquire db session in new task if needed, or use a fresh one.
                    # Since we are in the same process, we can use a new session.
                    from app.database import SessionLocal
                    from app.models.note import Note, Topic
                    
                    db_note = SessionLocal()
                    try:
                        # Fetch recent messages
                        msgs = db_note.query(Message).filter(Message.conversation_id == conv_id).order_by(Message.created_at.desc()).limit(10).all()
                        msgs.reverse()
                        history_text = "\n".join([f"{m.role}: {m.content}" for m in msgs])
                        
                        prompt = [
                            {"role": "system", "content": "You are a helpful assistant that extracts key information from conversations to build a 'Family Tree' and structured notes. Extract names, relationships, key facts, and important context. Return the result as a concise summary formatted as a Markdown note with headings like # Family Tree, # Key Facts, # Context."},
                            {"role": "user", "content": f"Analyze this conversation and extract key notes:\n\n{history_text}"}
                        ]
                        
                        note_content = await llm.chat_completion(prompt)
                        
                        if note_content:
                            # Check if a note for this conversation already exists
                            # We can use a naming convention or a specific tag.
                            # Let's just create a new note or append to a daily one.
                            # For "Family Tree", maybe we want a single persistent note?
                            # Let's create a note titled "Conversation Notes - {Date}"
                            from datetime import datetime
                            title = f"Conversation Notes - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
                            
                            # Create the note
                            note = Note(path=title, content=note_content)
                            
                            # Extract topics (simple heuristic or use LLM again)
                            # Let's just add a "Family Tree" topic
                            topic = db_note.query(Topic).filter(Topic.name == "Family Tree").first()
                            if not topic:
                                topic = Topic(name="Family Tree")
                                db_note.add(topic)
                            
                            note.topics = [topic]
                            db_note.add(note)
                            db_note.commit()
                    finally:
                        db_note.close()
                except Exception as e:
                    print(f"Error in automatic note generation: {e}")

            # Schedule the task
            asyncio.create_task(analyze_and_save_notes())

    except Exception as e:
        logger.error(f"Failed to trigger note generation: {e}")

    model_name = getattr(llm, 'model', 'unavailable') if llm else 'unavailable'
    return ChatResponse(
        response=response_text,
        emotion=emotion,
        conversation_id=str(conv_id),
        model=model_name
    )

@router.post("/relief", response_model=ChatResponse)
async def chat_relief(payload: ReliefChatRequest, req: Request, db: Session = Depends(get_db), user: Optional[User] = Depends(optional_get_current_user)):
    # Allow relief chat even without authentication for demo mode
    # Production should enforce authentication
    llm = getattr(req.app.state, 'groq', None) or getattr(req.app.state, 'openrouter', None)
    phi2 = getattr(req.app.state, 'phi2', None)
    if not llm:
        raise HTTPException(status_code=503, detail="LLM provider not configured")

    system_prompt = (
        "You are a compassionate, non-judgmental listener.\n"
        "Goals: actively listen, reflect feelings, validate emotions, avoid rushing to solutions.\n"
        "Use gentle, human language and phrases like 'It sounds like you're feeling...'.\n"
        "Offer coping suggestions only after validating, and keep them optional.\n"
        "If you detect extreme distress or self-harm risk, encourage seeking immediate help and provide crisis resources."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": payload.message}
    ]

    # Conversation persistence controlled by save_memory
    conv_id: int | None = None
    if payload.save_memory:
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

    import logging
    logger = logging.getLogger(__name__)
    try:
        response_text = await llm.chat_completion(messages, temperature=0.8, max_tokens=300)
        if not response_text:
            response_text = "I'm here with you. I wasn't able to generate a response right now. Could we try again?"
    except Exception as e:
        logger.error(f"Relief LLM error: {e}")
        raise HTTPException(status_code=500, detail="LLM error")

    # Gentle emotion analysis
    emotion = None
    try:
        if phi2 and payload.detect_emotion:
            emotion = phi2.detect_emotion(payload.message)
    except Exception:
        emotion = None

    # Simple crisis detection (non-diagnostic)
    crisis = False
    text_low = payload.message.lower()
    crisis_keywords = ["suicide", "kill myself", "end it", "can't go on", "harm myself", "overdose"]
    for kw in crisis_keywords:
        if kw in text_low:
            crisis = True
            break

    if payload.save_memory and conv_id is not None:
        db.add(Message(conversation_id=conv_id, role='assistant', content=response_text))
        db.commit()

    # Append gentle reflection with emotion if present
    if emotion and isinstance(emotion, dict) and emotion.get('label'):
        response_text += f"\n\nIt sounds like you might be feeling {emotion.get('label').lower()}. I'm here to listen."

    # Crisis resources text (non-exhaustive, US-focused)
    if crisis:
        response_text += (
            "\n\nI’m concerned for your safety. If you’re in immediate danger or thinking about harming yourself, please seek immediate help. "
            "In the U.S., you can call or text 988 (Suicide & Crisis Lifeline) or use 911 for emergencies. "
            "If outside the U.S., please check local emergency numbers or visit findahelpline.com."
        )

    model_name = getattr(llm, 'model', 'unavailable')
    return ChatResponse(
        response=response_text,
        emotion=emotion,
        conversation_id=str(conv_id) if conv_id is not None else "private",
        model=model_name,
    )

# Optional dev-mode endpoints (no auth) for quick diagnostics – toggle via env BUDDY_DEV_MODE=true
import os
DEV_MODE = os.environ.get("BUDDY_DEV_MODE", "false").lower() == "true"

def require_dev_mode():
    if not DEV_MODE:
        raise HTTPException(status_code=404, detail="Not found (enable with BUDDY_DEV_MODE=true)")

if DEV_MODE:
    @router.post("/dev/chat")
    async def dev_chat(payload: ChatRequest, req: Request, db: Session = Depends(get_db)):
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
        import logging
        logger = logging.getLogger(__name__)
        response_text = ""
        try:
            if llm and getattr(llm, 'chat_completion', None):
                logger.info(f"Calling LLM: {llm.__class__.__name__}")
                response_text = await llm.chat_completion(messages)
                if not response_text:
                    response_text = "I received your message but couldn't generate a response. Please try again."
            else:
                response_text = "Sorry, the AI service is not currently available. Please try again later."
        except Exception as e:
            logger.error(f"LLM error: {e}")
            response_text = f"I'm experiencing technical difficulties. Error: {str(e)[:100]}"
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
            model=model_name,
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
