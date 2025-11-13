from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from datetime import datetime
from app.database import Base

class Memory(Base):
    __tablename__ = "memory"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, index=True)
    memory_type = Column(String, default="fact")  # fact/preference/event/relationship
    content = Column(Text)
    importance = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.utcnow)
