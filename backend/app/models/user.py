from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    picture_url = Column(String, nullable=True)
    username = Column(String, unique=True, index=True, nullable=True)  # optional for legacy login
    hashed_password = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
