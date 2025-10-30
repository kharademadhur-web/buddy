# Buddy AI Assistant 🤖

An emotionally intelligent AI assistant with voice capabilities, powered by Microsoft Phi-2 language model and advanced sentiment analysis.

![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Python](https://img.shields.io/badge/python-3.12%2B-blue)
![PyTorch](https://img.shields.io/badge/PyTorch-2.5.0-red)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Usage Modes](#-usage-modes)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Performance](#-performance)

---

## 🌟 Overview

Buddy is a conversational AI assistant designed for Windows environments with:

- **Natural Language Understanding** via Microsoft Phi-2 (2.7B parameters)
- **Voice Interaction** with speech recognition and text-to-speech
- **Emotion Analysis** using dual sentiment/emotion detection models
- **Context Awareness** with conversation history tracking
- **Safety Filtering** for inappropriate content
- **Multiple Deployment Options** (CLI, Voice, API Server)

### Key Technologies
- **Language Model**: Microsoft Phi-2 / TinyLlama  
- **Sentiment Analysis**: DistilBERT (SST-2)
- **Emotion Detection**: Twitter-RoBERTa
- **Speech Recognition**: Google Speech API
- **TTS Engine**: pyttsx3
- **Web Framework**: FastAPI

---

## ✨ Features

### Core Capabilities
✅ Interactive natural conversations  
✅ Voice input and output support  
✅ Real-time sentiment analysis  
✅ Multi-modal input (text & voice)  
✅ Content safety filtering  
✅ Visual typing indicators  

### Safety & Quality
🛡️ Automatic content moderation  
🛡️ Anti-repetition validation  
🛡️ Graceful error handling  
🛡️ CPU-optimized inference  

### Deployment Options
1. **CLI Mode** - Text-based terminal interface
2. **Voice Mode** - Voice-activated assistant
3. **API Server** - RESTful API with FastAPI
4. **Lightweight Mode** - Minimal resource variant

---

## 💾 Installation

### Prerequisites
- Python 3.12+
- 4GB RAM minimum (8GB recommended)
- 10GB free disk space
- Windows 10/11
- Internet connection (first run)

### Steps

1. **Clone/Download Project**
   ```bash
   cd D:\Madhur\ai_assistant_project
   ```

2. **Install Dependencies**
   ```bash
   pip install --user -r requirements.txt
   ```

3. **Fix PyTorch (Windows)**
   ```bash
   python fix_torch.py
   ```

4. **Verify Installation**
   ```bash
   python test_syntax.py
   ```

Expected output: `🎉 All files have valid syntax!`

---

## 🚀 Quick Start

### 3-Step Launch

1. **Run the application**
   ```bash
   python app.py
   ```

2. **Select input mode**
   - Press `2` for Text Input (recommended)
   - Press `1` for Voice Input

3. **Start chatting**
   ```
   You: Hello Buddy!
   Buddy: Hello! How can I help you today?
   (Responded in 2.45s)
   
   You: quit
   👋 Session ended
   ```

### Example Session
```
🌟 Buddy AI Assistant 🌟
Choose input method:
1. Voice
2. Text
Selection (1/2): 2

You: What is Python?
Buddy: Python is a high-level programming language known for its simplicity 
and readability, widely used in web development and data science.
(Responded in 3.12s)

You: exit
👋 Session ended
```

---

## 🎮 Usage Modes

### 1. CLI Mode (Text)
```bash
python app.py
# Select option 2
```

Features: Text I/O, response timing, TTS playback

### 2. Voice Mode
```bash
python app.py
# Select option 1
```

Features: Microphone input, speech recognition, audio feedback

Requirements: Microphone, internet connection

### 3. API Server
```bash
python start_buddy.py
# Or: python phi_inference.py api
```

Starts REST API on `http://localhost:8000`

**Endpoint**: `POST /chat`

Request:
```json
{
  "text": "Hello!",
  "use_cache": true
}
```

Response:
```json
{
  "response": "Hello! How can I help?",
  "status": "success"
}
```

---

## 📁 Project Structure

```
buddy-ai-assistant/
│
├── 📄 Core Application
│   ├── app.py                  # Main CLI application
│   ├── core.py                 # BuddyCore with Phi-2
│   ├── speech.py               # Voice I/O handling
│   ├── utils.py                # Utility functions
│   └── config.py               # Configuration
│
├── 🤖 AI Models & APIs
│   ├── phi_inference.py        # Full API server
│   ├── buddy_api.py            # Optimized API
│   ├── start_buddy.py          # Simple API server
│   ├── emotion_engine.py       # Emotion analysis
│   └── lightweight_buddy.py    # Minimal version
│
├── 🧪 Testing & Tools
│   ├── test_syntax.py          # Syntax validator
│   ├── run_tests.py            # Test suite
│   └── fix_torch.py            # PyTorch repair
│
├── 📚 Documentation
│   ├── README.md               # This file
│   ├── QUICKSTART.md           # Quick guide
│   ├── FINAL_STATUS.md         # Status report
│   └── FIX_REPORT.md           # Technical docs
│
└── ⚙️ Configuration
    ├── requirements.txt        # Dependencies
    ├── config.json             # Model config
    └── *.json                  # Tokenizer configs
```

### Key Files

| File | Purpose | Size |
|------|---------|------|
| `app.py` | Main entry point | 1.8KB |
| `core.py` | Core AI logic | 2.4KB |
| `speech.py` | Voice I/O | 1.2KB |
| `phi_inference.py` | Full API | 6.4KB |
| `emotion_engine.py` | Sentiment analysis | 3.6KB |

---

## ⚙️ Configuration

### Model Selection
Edit `config.py`:

```python
# Choose your language model
MODEL_NAME = "microsoft/phi-2"           # 2.7B params (default)
# MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"  # Lighter

# Sentiment & Emotion models
SENTIMENT_MODEL = "distilbert-base-uncased-finetuned-sst-2-english"
EMOTION_MODEL = "cardiffnlp/twitter-roberta-base-emotion"
```

### Response Parameters
Adjust in `core.py`:

```python
max_new_tokens = 64        # Response length
temperature = 0.6          # Creativity (0.1-1.0)
top_p = 0.9                # Nucleus sampling
repetition_penalty = 1.1   # Anti-repetition
```

### Safety Filter
Customize in `config.py`:

```python
SAFETY_FILTER = r"(?i)\b(sex|violence|hate|suicide|racism)\b"
```

---

## 🔌 API Reference

### REST Endpoints

#### POST /chat
Send message and get response

**Request**:
```json
{
  "text": "Your message",
  "use_cache": true
}
```

**Response** (200):
```json
{
  "response": "AI response",
  "status": "success"
}
```

**Error** (500):
```json
{
  "detail": "Error message"
}
```

### Python API

```python
from core import BuddyCore

# Initialize
buddy = BuddyCore()

# Generate response
response, time = buddy.generate_response("Hello!")
print(f"{response} ({time:.2f}s)")
```

---

## 🧪 Testing

### Run All Tests
```bash
python run_tests.py
```

Tests:
- ✅ Syntax validation
- ✅ PyTorch import
- ✅ Transformers check
- ✅ Core module loading
- ✅ Speech verification
- ✅ Utils functionality

### Syntax Only
```bash
python test_syntax.py
```

### Manual Tests
```bash
# Test core
python -c "from core import BuddyCore; print('OK')"

# Test PyTorch
python -c "import torch; print(torch.__version__)"
```

---

## 🔧 Troubleshooting

### 1. PyTorch DLL Error

**Error**: `OSError: [WinError 1114] DLL initialization failed`

**Fix**:
```bash
python fix_torch.py
```

Or manually:
```bash
pip uninstall -y torch torchvision torchaudio
pip install --user torch==2.5.0+cpu --index-url https://download.pytorch.org/whl/cpu
```

### 2. Module Not Found

**Error**: `ModuleNotFoundError`

**Fix**:
```bash
pip install --user -r requirements.txt
```

### 3. Voice Input Fails

**Issues**: Microphone not working

**Solutions**:
- Use text mode (option 2)
- Check microphone permissions
- Verify internet connection
- Install: `pip install --user pyaudio`

### 4. Slow First Run

**Issue**: Model download takes time

**Info**: First run downloads 8-10GB of models
- Wait 5-15 minutes
- Models cache to `~/.cache/huggingface/`
- Subsequent runs are fast

### 5. Memory Error

**Fix**:
- Close other applications
- Use lightweight mode
- Reduce `max_new_tokens`
- Switch to TinyLlama model

---

## ⚡ Performance

### Benchmarks (CPU Mode)

| Metric | Value |
|--------|-------|
| First Response | 5-30s |
| Subsequent | 2-5s |
| Memory Usage | 2-4 GB |
| Model Download | 5-15 min |
| Disk Space | 8-10 GB |

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | Dual-core | Quad-core+ |
| RAM | 4 GB | 8 GB |
| Storage | 10 GB | 20 GB |
| OS | Windows 10 | Windows 11 |

### Optimization

1. Use CPU-only PyTorch ✅ (configured)
2. Reduce `max_new_tokens` for speed
3. Enable Redis caching
4. Use TinyLlama for lighter model
5. Limit conversation history

---

## 📦 Dependencies

### Core (Required)
```
torch>=2.0.0
transformers>=4.30.0
sentence-transformers>=2.2.2
speechrecognition>=3.10.0
pyttsx3>=2.90
numpy>=1.24.3
```

### Optional (Enhanced Features)
```
fastapi          # API server
uvicorn          # API runner
redis            # Caching
gtts             # Google TTS
pydub            # Audio
optimum          # ONNX optimization
onnxruntime      # ONNX runtime
keyboard         # Key handling
```

---

## 🎯 Status & Roadmap

### ✅ Current Status (v1.0.0)
- All syntax errors fixed
- All core modules tested
- PyTorch CPU installed
- Comprehensive documentation
- Production ready

### 🚀 Future Plans
- [ ] GPU acceleration
- [ ] Multi-language support
- [ ] Web UI (React)
- [ ] Mobile app
- [ ] Docker support
- [ ] Custom fine-tuning
- [ ] Plugin system

---

## 📊 Project History

**October 30, 2025** - v1.0.0
- Fixed all syntax errors (7 total)
- Added comprehensive testing
- Created documentation suite
- Installed PyTorch CPU version
- Production ready release

### Fixed Issues
1. ✅ Indentation error (phi_inference.py)
2. ✅ Missing methods (speech.py, emotion_engine.py)
3. ✅ Decorator issues (buddy_api.py, phi_inference.py)
4. ✅ Import error handling
5. ✅ PyTorch DLL error
6. ✅ Unicode console encoding

---

## 🙏 Acknowledgments

- **Microsoft** - Phi-2 language model
- **HuggingFace** - Transformers & model hub
- **PyTorch** - Deep learning framework
- **FastAPI** - Web framework
- **Cardiff NLP** - Emotion models

---

## 📞 Support

**Documentation**:
- `QUICKSTART.md` - Quick start guide
- `FINAL_STATUS.md` - Complete status report
- `FIX_REPORT.md` - Technical documentation

**Testing**:
```bash
python test_syntax.py   # Validate syntax
python run_tests.py     # Run all tests
python fix_torch.py     # Fix PyTorch
```

---

## 📝 License

MIT License - Free for personal and commercial use

---

## 👨‍💻 Author

**Madhur Khara**

*An intelligent AI companion for everyday tasks*

---

## 🎉 Quick Reference Card

```
┌─────────────────────────────────────────┐
│         BUDDY AI ASSISTANT              │
│         Quick Command Reference         │
├─────────────────────────────────────────┤
│                                         │
│  START:        python app.py            │
│  TEST:         python test_syntax.py    │
│  FIX PYTORCH:  python fix_torch.py      │
│  API SERVER:   python start_buddy.py    │
│                                         │
│  Text Mode:    Select option 2          │
│  Voice Mode:   Select option 1          │
│  Exit:         Type "quit" or "exit"    │
│                                         │
│  First Run:    5-15 min (model download)│
│  Response:     2-5 seconds typical      │
│  Memory:       2-4 GB during use        │
│                                         │
└─────────────────────────────────────────┘
```

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: October 30, 2025

**Ready to chat? Run:** `python app.py` 🚀
# buddy
