from pydantic import BaseModel
from typing import List, Optional

class ConversationBrief(BaseModel):
    id: int
    title: str
    created_at: str
    updated_at: Optional[str] = None

class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: str

class ConversationDetail(BaseModel):
    id: int
    title: str
    messages: List[MessageOut]