# Authentication Configuration Guide

## Overview

The Buddy AI Assistant supports multiple authentication methods:

1. **Google OAuth 2.0** - Production authentication method
2. **Demo/Guest Mode** - For development and testing
3. **Basic Token Auth** - For API access

## Frontend Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Identity Platform API
4. Create OAuth 2.0 credentials
5. Add authorized origins:
   - `http://localhost:5173` (local development)
   - `https://your-frontend-domain.com` (production)
6. Copy the Client ID to your frontend environment variables

### Environment Variables

Create `.env` file in `frontend/` directory:

```env
VITE_API_BASE=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Backend Configuration

### Environment Variables

Create `.env` file in `backend/` directory:

```env
# Required
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SECRET_KEY=change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-domain.com

# Optional Demo Mode (Development Only)
ALLOW_DEMO_AUTH=true
ENV=dev

# Database
DATABASE_URL=sqlite:///./buddy_ai.db

# OpenRouter (AI Engine)
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=deepseek/deepseek-chat
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### Auth Mode Options

1. **Production Mode**
   - `ALLOW_DEMO_AUTH=false` or not set
   - `ENV` not set or set to `prod`
   - Only valid Google OAuth tokens are accepted

2. **Development Mode with Demo Auth**
   - `ALLOW_DEMO_AUTH=true`
   - `ENV=dev`
   - Allows access without authentication for testing
   - Creates a Demo User when needed

3. **Protected Mode**
   - Default security without demo mode
   - All endpoints require valid authentication

## Authentication Flow

### Google OAuth Flow

1. User clicks "Sign in with Google" on the login page
2. Google OAuth popup authenticates the user
3. Frontend receives an ID token from Google
4. Frontend sends the token to `/api/auth/google`
5. Backend validates the token with Google
6. Backend creates a user record (if not exists) and returns a JWT
7. Frontend stores the JWT for future API requests

### Demo/Guest Flow

1. User clicks "Continue as Guest" on the login page
2. Frontend calls `/api/auth/token` with demo credentials
3. Backend returns a JWT token
4. Frontend stores the JWT for future API requests

## API Access

All API endpoints (except `/api/auth/token` and `/api/auth/google`) require authentication:

1. Include the JWT in the Authorization header:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

2. Store the token in localStorage as `buddy_token`

## Troubleshooting

### "Origin Not Allowed" Error

This error occurs when your frontend domain is not in the Google OAuth authorized origins:

1. Check your Google Cloud Console OAuth 2.0 settings
2. Add your frontend URL to "Authorized JavaScript origins"
3. Verify the URL exactly matches (including http/https and port)

### "Connection Refused" Error

This error occurs when the backend is not running or not accessible:

1. Check that the backend server is running on the configured port
2. Verify the `VITE_API_BASE` environment variable in the frontend
3. Check browser console for CORS errors

### Authentication Issues

1. Check that the backend has the correct environment variables
2. Verify the JWT secret key is the same between frontend and backend
3. Check that the JWT token has not expired

## Security Notes

- Never commit your `.env` files to version control
- Use strong, unique secrets in production
- Regularly rotate your JWT secret keys
- Consider using a secure authentication service for production deployments
- Implement additional rate limiting for authentication endpoints