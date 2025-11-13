from pydantic import BaseModel
from typing import List, Optional, Any

class NoteOrganizeRequest(BaseModel):
    text: str
    save: bool = False
    path: Optional[str] = None
    detect_emotion: bool = False

class Heading(BaseModel):
    level: int
    text: str

class NoteOrganizeResponse(BaseModel):
    headings: List[Heading]
    topics: List[str]
    categories: List[str]
    emotions: Optional[Any] = None
    processing_time_ms: int
