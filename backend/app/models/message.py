from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    role = Column(String, nullable=False)  # 'system' | 'user' | 'assistant'
    content = Column(Text, nullable=False)
    tokens_in = Column(Integer, default=0)
    tokens_out = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)