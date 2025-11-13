from transformers import pipeline
import torch
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class Phi2Service:
    """Local emotion detection pipeline (privacy-focused)."""
    def __init__(self):
        self.device = 0 if torch.cuda.is_available() else -1
        model = settings.EMOTION_MODEL
        self.analyzer = pipeline("sentiment-analysis", model=model, device=self.device)
        logger.info("Emotion detection model loaded")

    def detect_emotion(self, text: str) -> dict:
        try:
            result = self.analyzer(text[:512])[0]
            return {"label": result["label"].lower(), "confidence": float(result["score"]) }
        except Exception as e:
            logger.error(f"Emotion detection error: {e}")
            return {"label": "neutral", "confidence": 0.5}
