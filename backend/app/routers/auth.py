from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import timedelta, datetime
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.config import settings
from app.database import SessionLocal
from app.models.user import User
from app.utils.auth import create_access_token, verify_google_id_token, get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
FAKE_USER_DB = {
    "demo": pwd_context.hash("demo123")
}

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/token", response_model=Token)
def login(data: LoginRequest):
    hashed = FAKE_USER_DB.get(data.username)
    if not hashed or not pwd_context.verify(data.password, hashed):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": data.username})
    return Token(access_token=token)

class GoogleLoginRequest(BaseModel):
    credential: str  # ID token from @react-oauth/google

class UserOut(BaseModel):
    id: int
    email: str | None = None
    name: str | None = None
    picture_url: str | None = None

class GoogleLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

@router.post("/google", response_model=GoogleLoginResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    import logging
    log = logging.getLogger(__name__)
    try:
        info = verify_google_id_token(payload.credential)
    except Exception as e:
        log.error(f"Google token verification failed: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")
    
    google_id = info.get("sub")
    email = info.get("email")
    name = info.get("name")
    picture = info.get("picture")
    if not google_id:
        log.error(f"Google token missing 'sub': {info.keys()}")
        raise HTTPException(status_code=401, detail="Invalid Google token (no sub)")

    user = db.query(User).filter((User.google_id == google_id) | (User.email == email)).first()
    if not user:
        user = User(google_id=google_id, email=email, name=name, picture_url=picture)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # update info
        updated = False
        if name and user.name != name:
            user.name = name; updated = True
        if picture and user.picture_url != picture:
            user.picture_url = picture; updated = True
        if email and user.email != email:
            user.email = email; updated = True
        if updated:
            db.commit()

    token = create_access_token({"sub": user.google_id or user.email or str(user.id)})
    return GoogleLoginResponse(
        access_token=token,
        user=UserOut(id=user.id, email=user.email, name=user.name, picture_url=user.picture_url)
    )
