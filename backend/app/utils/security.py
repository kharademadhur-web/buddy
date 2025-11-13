from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import HTTPException, Header
from app.config import settings

def create_access_token(subject: str) -> str:
    to_encode = {"sub": subject, "exp": datetime.utcnow() + timedelta(minutes=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES))}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: str | None = Header(None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    return payload.get("sub", "")
