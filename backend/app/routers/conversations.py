from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import SessionLocal
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.conversation import ConversationBrief, ConversationDetail, MessageOut

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=List[ConversationBrief])
def list_conversations(db: Session = Depends(get_db)):
    rows = (
        db.query(Conversation)
        .order_by(Conversation.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        ConversationBrief(
            id=r.id,
            title=f"Conversation {r.id}",
            created_at=r.created_at.isoformat(),
            updated_at=None,
        )
        for r in rows
    ]


@router.get("/{conversation_id}", response_model=ConversationDetail)
def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Not found")
    msgs = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return ConversationDetail(
        id=conv.id,
        title=f"Conversation {conv.id}",
        messages=[
            MessageOut(
                id=m.id,
                role=m.role,
                content=m.content,
                created_at=m.created_at.isoformat(),
            )
            for m in msgs
        ],
    )


@router.delete("/{conversation_id}", status_code=204)
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    deleted = db.query(Conversation).filter(Conversation.id == conversation_id).delete()
    db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")
    return