import os
from dotenv import load_dotenv

# Load backend .env
load_dotenv(dotenv_path=os.path.join('backend', '.env'))

print('ENV =', os.getenv('ENV'))
print('ALLOW_DEMO_AUTH =', os.getenv('ALLOW_DEMO_AUTH'))
print('GOOGLE_CLIENT_ID set =', bool(os.getenv('GOOGLE_CLIENT_ID')))
print('ALLOWED_ORIGINS =', os.getenv('ALLOWED_ORIGINS'))
