from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from fastapi import Depends, HTTPException, Request
from jose import jwt, JWTError
from sqlalchemy.orm import Session
# Lazy import inside verify_google_id_token to avoid import-time failures in slim environments
# from google.oauth2 import id_token
# from google.auth.transport import requests as google_requests

from app.config import settings
from app.database import SessionLocal
from app.models.user import User


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    import os
    from app.config import settings as _settings
    # Consider DEV if ENV=dev or settings.debug is True
    is_dev = (os.environ.get("ENV") == "dev") or bool(getattr(_settings, "debug", False))

    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        # In dev mode, allow unauthenticated requests; create a dummy user
        if is_dev:
            user = db.query(User).filter(User.email == "dev@localhost").first()
            if not user:
                user = User(google_id="dev", email="dev@localhost", username="dev", name="Dev User")
                db.add(user)
                db.commit()
            return user
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth.split(" ", 1)[1]
    try:
        payload = verify_token(token)
    except Exception:
        # If token invalid but dev mode, still allow
        if is_dev:
            user = db.query(User).filter(User.email == "dev@localhost").first()
            if not user:
                user = User(google_id="dev", email="dev@localhost", username="dev", name="Dev User")
                db.add(user)
                db.commit()
            return user
        raise
    sub = payload.get("sub") if isinstance(payload, dict) else None
    if not sub:
        if is_dev:
            user = db.query(User).filter(User.email == "dev@localhost").first()
            if not user:
                user = User(google_id="dev", email="dev@localhost", username="dev", name="Dev User")
                db.add(user)
                db.commit()
            return user
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = db.query(User).filter((User.google_id == sub) | (User.email == sub) | (User.username == sub)).first()
    if not user:
        if is_dev:
            user = User(google_id="dev", email="dev@localhost", username="dev", name="Dev User")
            db.add(user)
            db.commit()
            return user
        raise HTTPException(status_code=401, detail="User not found")
    return user


def verify_google_id_token(credential: str) -> Dict[str, Any]:
    if not settings.google_client_id:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID not configured")
    try:
        from google.oauth2 import id_token as _id_token  # type: ignore
        from google.auth.transport import requests as google_requests  # type: ignore
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"google-auth not available: {e}")
    try:
        idinfo = _id_token.verify_oauth2_token(credential, google_requests.Request(), settings.google_client_id)
        # idinfo includes: sub (google user id), email, name, picture, email_verified
        return idinfo
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {e}")
