# Fixing Google Authentication

## Step 1: Start the Backend Server

First, make sure your backend server is running on port 8000:

```bash
# Navigate to your backend directory
cd ../backend  # or wherever your backend code is located

# Start the server (depends on your backend framework)
# For Python/FastAPI:
uvicorn main:app --reload --port 8000

# For Node.js/Express:
npm start
# or
node server.js
```

## Step 2: Configure Google OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Enable "Google+ API" or "People API" (depending on what your backend needs)
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Select "Web application"
6. Add these JavaScript origins:
   - `http://localhost:5173` (for Vite dev server)
   - `http://localhost:3000` (if using Create React App)
   - Add your production URL when deploying
7. Add these authorized redirect URIs:
   - `http://localhost:5173`
8. Copy and update the Client ID in your `.env` file

## Step 3: Check Backend OAuth Configuration

Your backend needs to:
1. Handle the Google OAuth flow at `/api/auth/google`
2. Validate the Google ID token received from the frontend
3. Return a JWT token to the frontend

## Step 4: Test the Fix

1. Restart your frontend server
2. Try clicking the Google Sign-In button
3. Check browser console for any errors
4. Verify the backend receives the Google credential

## Alternative: Use Guest Mode

If Google authentication continues to fail, you can use the "Continue as Guest" option which should work without the backend running, as it uses a demo login endpoint.