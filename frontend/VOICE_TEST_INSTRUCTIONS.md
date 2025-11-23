# Voice Test Instructions

Follow these steps to verify your browser can do speech-to-text (STT) and text-to-speech (TTS):

1. Open the local file in your browser:
   - Double-click `VOICE_TEST.html` in your project root (or open `dist/VOICE_TEST.html` after a build).
   - If the browser blocks mic on a file:// URL, serve it with any static server (e.g. `npx serve dist`).

2. Grant mic permission when prompted.

3. Click "🎙️ Start Listening" and say a sentence.
   - Expected: "Transcript: ..." appears and the browser speaks back a confirmation.

4. Click "🔊 Speak Sample".
   - Expected: You hear Buddy say a sample sentence.

Troubleshooting:
- If STT shows "not supported", use Chrome or Edge (desktop) and ensure mic access is allowed.
- If TTS is silent, check system volume and make sure no Bluetooth audio device is hijacking output.
- On iOS, STT in Safari can be limited; test on desktop first.
