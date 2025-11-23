from pydantic import BaseModel
from typing import Optional, Any

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    detect_emotion: bool = True

class ChatResponse(BaseModel):
    response: str
    emotion: Optional[Any] = None
    conversation_id: str
    model: str

class ReliefChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    detect_emotion: bool = True
    save_memory: bool = True  # allow private mode when False
