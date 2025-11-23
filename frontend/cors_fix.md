# CORS Configuration Fix for Google Authentication

## Backend CORS Configuration

Your backend needs to allow requests from your Netlify domain. Add this to your backend server:

### For Python FastAPI:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://papaya-bublanina-afa881.netlify.app",
        "http://localhost:5173",  # for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### For Node Express:
```javascript
const cors = require('cors');

const corsOptions = {
  origin: [
    'https://papaya-bublanina-afa881.netlify.app',
    'http://localhost:5173'  // for development
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### For Python Flask:
```python
from flask_cors import CORS

CORS(app, origins=[
    'https://papaya-bublanina-afa881.netlify.app',
    'http://localhost:5173'  # for development
], supports_credentials=True)
```

### Deployment Steps:

1. Add the CORS configuration to your backend
2. Deploy/Restart your backend on Render
3. Wait 2-3 minutes for the deployment to complete
4. Test Google authentication on your Netlify site

When this is deployed, your backend will include the necessary CORS headers like:
- Access-Control-Allow-Origin: https://papaya-bublanina-afa881.netlify.app
- Access-Control-Allow-Credentials: true
- Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS