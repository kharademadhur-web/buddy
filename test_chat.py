import requests
import json

# Test the chat endpoint
url = "http://localhost:8000/api/chat/"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer dev"
}
data = {
    "message": "Hello, can you hear me?",
    "detect_emotion": True
}

try:
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
