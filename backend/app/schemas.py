from pydantic import BaseModel
from typing import List, Optional

class OrganizeRequest(BaseModel):
    text: str
    save: bool = False
    path: Optional[str] = None

class Heading(BaseModel):
    level: int
    text: str

class OrganizeResult(BaseModel):
    headings: List[Heading]
    topics: List[str]

class NoteOut(BaseModel):
    id: int
    path: Optional[str]
    content: str
    topics: List[str] = []

    class Config:
        from_attributes = True
