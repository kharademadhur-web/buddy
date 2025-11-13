from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.database import Base

note_topic = Table(
    "note_topic",
    Base.metadata,
    Column("note_id", Integer, ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
    Column("topic_id", Integer, ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True),
)

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    path = Column(String, nullable=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    topics = relationship("Topic", secondary=note_topic, back_populates="notes")

class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    notes = relationship("Note", secondary=note_topic, back_populates="topics")
