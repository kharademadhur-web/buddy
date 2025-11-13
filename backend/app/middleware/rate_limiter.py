from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import time
from collections import defaultdict, deque

class RateLimiter(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 60, time_window: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "anonymous"
        now = time.time()
        q = self.requests[client_ip]
        while q and q[0] < now - self.time_window:
            q.popleft()
        if len(q) >= self.max_requests:
            return Response("Too Many Requests", status_code=429)
        q.append(now)
        return await call_next(request)
