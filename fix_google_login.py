"""
Script to fix the Google Client ID in the backend .env file
"""
import os
from pathlib import Path

# Path to the .env file
env_file = Path(__file__).parent / 'backend' / '.env'

# Correct Google Client ID
CORRECT_CLIENT_ID = '423787673770-pu2bgl97aovjfgee70chpflsh98c3jnu.apps.googleusercontent.com'

def fix_google_client_id():
    """Fix the Google Client ID in the .env file"""
    
    if not env_file.exists():
        print(f"❌ .env file not found at: {env_file}")
        print("Creating new .env file...")
        
        # Create a new .env file with correct settings
        env_content = f"""# Google OAuth Configuration
GOOGLE_CLIENT_ID={CORRECT_CLIENT_ID}

# JWT Configuration
SECRET_KEY=your-secret-key-change-in-production-12345
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,https://papaya-bublanina-afa881.netlify.app,https://classy-begonia-426c14.netlify.app

# Development Mode
ALLOW_DEMO_AUTH=true
BUDDY_DEV_MODE=true
DEBUG=true

# AI Service Configuration
# Add your API keys here for AI to work
# Get free API key from: https://openrouter.ai/keys
OPENROUTER_API_KEY=

# Alternative: Get free API key from: https://console.groq.com/keys
GROQ_API_KEY=

# Database
DATABASE_URL=sqlite:///buddy_notes.db
"""
        env_file.write_text(env_content, encoding='utf-8')
        print(f"✅ Created new .env file with correct Google Client ID")
        return
    
    # Read the current .env file
    content = env_file.read_text(encoding='utf-8')
    lines = content.split('\n')
    
    # Find and replace the GOOGLE_CLIENT_ID line
    updated = False
    new_lines = []
    
    for line in lines:
        if line.strip().startswith('GOOGLE_CLIENT_ID='):
            old_value = line.split('=', 1)[1] if '=' in line else ''
            new_line = f'GOOGLE_CLIENT_ID={CORRECT_CLIENT_ID}'
            
            if old_value.strip() != CORRECT_CLIENT_ID:
                print(f"📝 Updating Google Client ID...")
                print(f"   Old: {old_value}")
                print(f"   New: {CORRECT_CLIENT_ID}")
                new_lines.append(new_line)
                updated = True
            else:
                print(f"✅ Google Client ID is already correct!")
                new_lines.append(line)
        else:
            new_lines.append(line)
    
    if updated:
        # Write back to file
        env_file.write_text('\n'.join(new_lines), encoding='utf-8')
        print(f"\n✅ Successfully updated {env_file}")
        print("\n⚠️  IMPORTANT: Restart the backend server for changes to take effect!")
        print("   Press Ctrl+C in the backend terminal, then run:")
        print("   python -m uvicorn app.main:app --reload --port 8000")
    elif 'GOOGLE_CLIENT_ID' not in content:
        print("⚠️  GOOGLE_CLIENT_ID not found in .env file")
        print("Adding it now...")
        new_lines.append(f'\nGOOGLE_CLIENT_ID={CORRECT_CLIENT_ID}')
        env_file.write_text('\n'.join(new_lines), encoding='utf-8')
        print("✅ Added Google Client ID to .env file")
        print("\n⚠️  Restart the backend server for changes to take effect!")

if __name__ == '__main__':
    print("🔧 Fixing Google Client ID in backend/.env file...\n")
    fix_google_client_id()
    print("\n✨ Done!")
