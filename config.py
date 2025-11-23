# Configuration constants (no torch dependency)
MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
SENTIMENT_MODEL = "distilbert-base-uncased-finetuned-sst-2-english"
SIMILARITY_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EMOTION_MODEL = "cardiffnlp/twitter-roberta-base-emotion"
MAX_HISTORY = 5
SAFETY_FILTER = r"(?i)\b(sex|violence|hate|suicide|racism)\b"

# Device selection moved to core.py
