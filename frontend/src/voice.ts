/**
 * Web Speech API utilities for voice companion
 */

// Text-to-Speech using Web Speech API
export function textToSpeech(
  text: string,
  onEnd?: () => void,
  onBoundary?: (event: SpeechSynthesisEvent) => void
): void {
  const synth = window.speechSynthesis;
  if (!synth) {
    console.error('Speech synthesis not supported');
    onEnd?.();
    return;
  }

  // Cancel any existing speech to prevent overlapping
  synth.cancel();

  // Ensure we have voices to work with
  const voices = synth.getVoices();
  if (voices.length === 0) {
    console.warn('No voices available', 'Trying to initialize voices...');
    // Try to trigger voice loading and retry once
    if (synth.onvoiceschanged !== null) {
      synth.onvoiceschanged = () => {
        console.log('Voices loaded on demand:', synth.getVoices().length);
        void textToSpeech(text, onEnd); // Retry after voices are loaded
      };
      return;
    }
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95; // Slightly slower for better comprehension
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  utterance.lang = 'en-US';

  // Better voice selection with more Windows-specific options
  const friendlyVoice =
    voices.find(v => v.name.includes('Microsoft Zira')) ||
    voices.find(v => v.name.includes('Microsoft David')) ||
    voices.find(v => v.name.includes('Google UK English Female')) ||
    voices.find(v => v.name.includes('Samantha')) ||
    voices.find(v => v.name.includes('English US') && v.localService) ||
    voices.find(v => v.lang.startsWith('en') && v.localService) || // Prefer local English voices
    voices.find(v => v.default) ||
    voices[0];

  if (friendlyVoice) {
    utterance.voice = friendlyVoice;
    console.log('Using voice:', friendlyVoice.name, friendlyVoice.lang);
  } else {
    console.warn('No suitable voice found, using default');
  }

  utterance.onstart = () => {
    console.log('Speech started');
  };

  utterance.onend = () => {
    console.log('Speech finished');
    onEnd?.();
  };

  utterance.onerror = e => {
    console.error('Speech error:', e);
    onEnd?.();
  };

  if (onBoundary) {
    utterance.onboundary = onBoundary;
  }

  // Chrome on Windows sometimes needs a very brief pause
  setTimeout(() => {
    // Ensure the synthesis hasn't been cancelled in the meantime
    if (synth.speaking) {
      synth.cancel(); // Cancel and restart to fix potential stuck state
      setTimeout(() => synth.speak(utterance), 50);
    } else {
      synth.speak(utterance);
      console.log('Speaking:', text);
    }
  }, 100);
}

// Speech-to-Text using Web Speech API
export function startSpeechRecognition(
  onResult: (text: string) => void,
  onError?: (error: string) => void
): () => void {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError?.('Speech Recognition not supported in this browser');
    return () => { };
  }

  // If TTS is speaking, stop it before listening (prevents immediate cutoff)
  const synth = window.speechSynthesis;
  if (synth && (synth.speaking || synth.pending)) {
    try { synth.cancel(); } catch { }
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  (recognition as any).maxAlternatives = 1;

  let timeoutId: any = null;
  const clearTimer = () => { if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; } };

  recognition.onstart = () => {
    // Auto-cancel if nothing is heard for 8s (no-speech edge cases)
    // clearTimer();
    // timeoutId = setTimeout(() => {
    //   try { recognition.stop(); } catch { }
    //   onError?.('no-speech');
    // }, 20000);
  };

  recognition.onresult = (event: any) => {
    clearTimer();
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    const t = transcript.trim();
    if (t) onResult(t);
  };

  recognition.onspeechend = () => {
    // Some engines require explicit stop when speech ends
    try { recognition.stop(); } catch { }
  };

  recognition.onend = () => {
    clearTimer();
    // If nothing fired onresult, propagate a benign end only if caller wants errors
    // Do not call onError here to avoid duplicate error paths.

    // Auto-restart if it stopped but we didn't ask it to (e.g. silence timeout by browser)
    // We can simulate a 'no-speech' error to trigger the retry logic in the UI
    onError?.('no-speech');
  };

  recognition.onerror = (event: any) => {
    clearTimer();
    if (event.error === 'aborted') return;
    onError?.(event?.error || 'unknown');
  };

  recognition.start();

  return () => {
    clearTimer();
    try { recognition.stop(); } catch { }
  };
}

export function stopSpeech(): void {
  window.speechSynthesis.cancel();
}

// Initialize voice engines
export function initializeVoices(): Promise<void> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      console.warn('Speech synthesis not supported');
      resolve();
      return;
    }

    // Force voices loading on Chrome/Windows by speaking and canceling a dummy utterance
    try {
      const dummy = new SpeechSynthesisUtterance('');
      synth.speak(dummy);
      synth.pause();
      synth.resume();
      synth.cancel(); // This will trigger voice loading in Chrome on Windows
    } catch (e) {
      console.warn('Could not force voice loading:', e);
    }

    // Check if voices are already loaded
    const voices = synth.getVoices();
    if (voices.length > 0) {
      console.log('Voices already loaded:', voices.length);
      // List commonly available Windows voices for debugging
      const windowsVoices = voices.filter(v =>
        v.name.includes('Microsoft') || v.name.includes('Zira') || v.name.includes('David')
      );
      if (windowsVoices.length > 0) {
        console.log('Found Windows voices:', windowsVoices.map(v => v.name).join(', '));
      }
      resolve();
    } else {
      // Wait for voices to be loaded
      let resolved = false;
      synth.onvoiceschanged = () => {
        if (resolved) return; // Prevent multiple calls
        const loadedVoices = synth.getVoices();
        console.log('Voices loaded:', loadedVoices.length);

        // List commonly available voices
        const windowsVoices = loadedVoices.filter(v =>
          v.name.includes('Microsoft') || v.name.includes('Zira') || v.name.includes('David')
        );
        if (windowsVoices.length > 0) {
          console.log('Found Windows voices:', windowsVoices.map(v => v.name).join(', '));
        }

        resolved = true;
        resolve();
      };

      // Fallback timeout in case voiceschanged doesn't fire
      setTimeout(() => {
        if (!resolved) {
          const fallbackVoices = synth.getVoices();
          console.log('Voice loading fallback - found', fallbackVoices.length, 'voices');
          resolved = true;
          resolve();
        }
      }, 2000);

      // Trigger voice loading
      synth.getVoices();
    }
  });
}
