# Updated emotional analysis subsystem (create new file emotion_engine.py)
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import torch
import numpy as np

class EmotionAnalyzer:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.models_loaded = False
        self.sentiment_labels = {
            0: "NEGATIVE",
            1: "POSITIVE"
        }
        self.emotion_labels = {
            0: "anger",
            1: "joy",
            2: "optimism",
            3: "sadness"
        }
        
    def load_models(self):
        """Load all models in parallel with error handling"""
        try:
            # Sentiment models
            self.distilbert_tokenizer = AutoTokenizer.from_pretrained(
                "distilbert-base-uncased-finetuned-sst-2-english"
            )
            self.distilbert_model = AutoModelForSequenceClassification.from_pretrained(
                "distilbert-base-uncased-finetuned-sst-2-english"
            ).to(self.device)

            # Emotion models
            self.emotion_tokenizer = AutoTokenizer.from_pretrained(
                "cardiffnlp/twitter-roberta-base-emotion"
            )
            self.emotion_model = AutoModelForSequenceClassification.from_pretrained(
                "cardiffnlp/twitter-roberta-base-emotion"
            ).to(self.device)

            # Fallback pipeline
            self.fallback_pipeline = pipeline(
                "sentiment-analysis",
                device=self.device
            )
            
            self.models_loaded = True
        except Exception as e:
            print(f"Error loading models: {e}")
            self.models_loaded = False

    def analyze(self, text: str) -> dict:
        """Analyze text for sentiment and emotion"""
        if not self.models_loaded:
            self.load_models()
        
        # Add neutral detection for short messages
        if len(text.split()) < 3:
            return {
                "sentiment": {"label": "NEUTRAL", "score": 0.8},
                "emotion": {"label": "neutral", "score": 0.8}
            }
        
        try:
            # DistilBERT sentiment analysis
            inputs = self.distilbert_tokenizer(text, return_tensors="pt", truncation=True).to(self.device)
            with torch.no_grad():
                logits = self.distilbert_model(**inputs).logits
            probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
            sentiment = {
                "label": self.sentiment_labels[np.argmax(probs)],
                "score": float(np.max(probs)),
                "model": "distilbert"
            }

            # Twitter-RoBERTa emotion analysis
            emotion_inputs = self.emotion_tokenizer(text, return_tensors="pt", truncation=True).to(self.device)
            with torch.no_grad():
                emotion_logits = self.emotion_model(**emotion_inputs).logits
            emotion_probs = torch.softmax(emotion_logits, dim=1).cpu().numpy()[0]
            emotion = {
                "label": self.emotion_labels[np.argmax(emotion_probs)],
                "score": float(np.max(emotion_probs)),
                "model": "twitter-roberta"
            }

            return {
                "sentiment": sentiment,
                "emotion": emotion,
                "combined_score": (sentiment["score"] + emotion["score"]) / 2
            }
            
        except Exception as e:
            print(f"Analysis error: {e}")
            return self.fallback_pipeline(text)[0]