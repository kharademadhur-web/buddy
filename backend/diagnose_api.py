import os
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("== Health ==")
print(client.get("/api/health").status_code)

print("\n== OpenAPI paths ==")
openapi = client.get("/openapi.json").json()
print(list(openapi.get("paths", {}).keys()))

print("\n== Auth token ==")
res = client.post("/api/auth/token", json={"username":"demo","password":"demo123"})
print(res.status_code, res.text)
if res.ok:
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("\n== Chat ==")
    r = client.post("/api/chat/", json={"message":"hello","detect_emotion": True}, headers=headers)
    print(r.status_code, r.text)

    print("\n== Notes ==")
    r = client.post("/api/notes/organize", json={"text":"I am excited about my project!"}, headers=headers)
    print(r.status_code, r.text)

    print("\n== Emotion summary ==")
    r = client.get("/api/emotion/summary?user_id=demo&days=7", headers=headers)
    print(r.status_code, r.text)
