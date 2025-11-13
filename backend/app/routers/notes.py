from typing import List
from fastapi import APIRouter, Depends, Request, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.note import Note, Topic
from app.schemas.note import NoteOrganizeRequest, NoteOrganizeResponse

router = APIRouter(prefix="/api/notes", tags=["notes"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


from app.utils.auth import get_current_user
from app.models.user import User

@router.post("/organize", response_model=NoteOrganizeResponse)
async def organize(req: NoteOrganizeRequest, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    llm = request.app.state.openrouter or request.app.state.groq
    phi2 = request.app.state.phi2

    import asyncio
    if not llm:
        return NoteOrganizeResponse(headings=[], topics=[], categories=[], emotions=None, processing_time_ms=0)
    headings_task = llm.generate_headings(req.text)
    topics_task = llm.extract_topics(req.text)
    categories_task = llm.categorize_note(req.text)

    headings, topics, categories = await asyncio.gather(headings_task, topics_task, categories_task)

    emotions = None
    if phi2 and req.detect_emotion:
        emotions = phi2.detect_emotion(req.text)

    if req.save:
        note = Note(path=req.path, content=req.text)
        topic_objs: List[Topic] = []
        for t in topics:
            existing = db.query(Topic).filter(Topic.name == t).first()
            if not existing:
                existing = Topic(name=t)
                db.add(existing)
                db.flush()
            topic_objs.append(existing)
        note.topics = topic_objs
        db.add(note)
        db.commit()

    return NoteOrganizeResponse(headings=headings, topics=topics, categories=categories, emotions=emotions, processing_time_ms=50)


@router.post("/import", response_model=NoteOrganizeResponse)
async def import_file(request: Request, file: UploadFile = File(...), db: Session = Depends(get_db)):
    llm = request.app.state.openrouter or request.app.state.groq
    phi2 = request.app.state.phi2
    if not llm:
        raise HTTPException(status_code=503, detail="LLM provider not configured")

    raw = await file.read()
    text = None
    # Try UTF-8 then fallback
    for enc in ("utf-8", "utf-16", "latin-1"):
        try:
            text = raw.decode(enc)
            break
        except Exception:
            continue
    if not text:
        raise HTTPException(status_code=400, detail="Unable to decode file")

    import asyncio
    headings_task = llm.generate_headings(text)
    topics_task = llm.extract_topics(text)
    categories_task = llm.categorize_note(text)

    headings, topics, categories = await asyncio.gather(headings_task, topics_task, categories_task)
    emotions = None
    if phi2:
        emotions = phi2.detect_emotion(text[:5000])

    note = Note(path=file.filename, content=text)
    topic_objs: List[Topic] = []
    for t in topics:
        existing = db.query(Topic).filter(Topic.name == t).first()
        if not existing:
            existing = Topic(name=t)
            db.add(existing)
            db.flush()
        topic_objs.append(existing)
    note.topics = topic_objs
    db.add(note)
    db.commit()

    return NoteOrganizeResponse(headings=headings, topics=topics, categories=categories, emotions=emotions, processing_time_ms=50)
