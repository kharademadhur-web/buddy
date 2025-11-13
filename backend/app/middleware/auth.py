from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from jose import JWTError

from app.utils.auth import verify_token


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request.state.user = None
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1]
            try:
                payload = verify_token(token)
                request.state.user = payload
            except Exception:
                # Do not block here; dependencies can enforce auth
                request.state.user = None
        response = await call_next(request)
        return response