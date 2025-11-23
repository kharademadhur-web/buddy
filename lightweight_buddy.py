from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with ['http://localhost:3000'] or your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"message": "Welcome to Buddy AI!"}

@app.post("/chat")
async def chat_endpoint(data: Message):
    user_input = data.message
    # Replace this with actual AI logic
    response = f"🤖 Buddy says: You said '{user_input}'"
    return {"response": response}
