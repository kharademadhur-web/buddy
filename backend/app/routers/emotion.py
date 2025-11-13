from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.emotion_organizer import EmotionOrganizer

router = APIRouter(prefix="/api/emotion", tags=["emotion"])

organizer = EmotionOrganizer(base_path="./user_data")

from fastapi import Depends, Request
from app.utils.auth import get_current_user
from app.models.user import User


class OrganizePayload(BaseModel):
    user_id: str
    message: str
    # Optional analysis from another model
    emotion: Optional[str] = None
    emotion_confidence: Optional[int] = None


@router.post("/organize")
async def organize(payload: OrganizePayload, user: User = Depends(get_current_user)):
    analysis = None
    if payload.emotion:
        analysis = {
            'emotion': (payload.emotion or '').lower(),
            'confidence': payload.emotion_confidence or 70,
        }
    return await organizer.organize_message(payload.user_id, payload.message, analysis)


@router.get("/summary")
async def summary(user_id: str = Query(...), days: int = Query(7, ge=1, le=365), _: User = Depends(get_current_user)):
    return await organizer.get_emotion_summary(user_id=user_id, days=days)


@router.get("/categories")
async def categories(user_id: str = Query(...), _: User = Depends(get_current_user)):
    return await organizer.get_category_list(user_id)


@router.get("/search")
async def search(user_id: str = Query(...), keyword: str = Query(...), category: Optional[str] = Query(None), _: User = Depends(get_current_user)):
    return await organizer.search_notes(user_id=user_id, keyword=keyword, category=category)