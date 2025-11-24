/**
 * Web Speech API utilities for voice companion
 */

// Detect if text contains Hindi/Devanagari characters
function containsHindi(text: string): boolean {
  // Check for Devanagari Unicode range (U+0900 to U+097F)
  const devanagariRegex = /[\u0900-\u097F]/;
  return devanagariRegex.test(text);
}

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

  // Detect language and select appropriate voice
  const isHindi = containsHindi(text);

  if (isHindi) {
    // Hindi voice settings - slower and clearer
    utterance.rate = 0.85; // Slower for clearer Hindi pronunciation
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'hi-IN'; // Hindi language code

    // Select Hindi voice - prefer Microsoft Hemant (male) or Kalpana (female)
    const hindiVoice =
      voices.find(v => v.name.includes('Microsoft Hemant')) || // Male Hindi voice
      voices.find(v => v.name.includes('Microsoft Kalpana')) || // Female Hindi voice
      voices.find(v => v.name.includes('Swara')) || // Alternative Hindi voice
      voices.find(v => v.lang === 'hi-IN') || // Any Hindi voice
      voices.find(v => v.lang.startsWith('hi')) || // Any Hindi variant
      voices.find(v => v.name.includes('Google हिन्दी')) || // Google Hindi
      voices.find(v => v.name.toLowerCase().includes('hindi')); // Any voice with "hindi" in name

    if (hindiVoice) {
      utterance.voice = hindiVoice;
      console.log('Using Hindi voice:', hindiVoice.name, hindiVoice.lang);
    } else {
      console.warn('No Hindi voice found, using default (may sound unclear)');
      console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`).join(', '));
    }
  } else {
    // English voice settings
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
      console.log('Using English voice:', friendlyVoice.name, friendlyVoice.lang);
    } else {
      console.warn('No suitable voice found, using default');
    }
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

// Speech-to-Text using Web Speech API with multi-language support
export function startSpeechRecognition(
  onResult: (text: string) => void,
  onError?: (error: string) => void,
  language: 'en-US' | 'hi-IN' | 'auto' = 'auto' // Support Hindi, English, or auto-detect
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

  // Set language - default to Hindi for better local language support
  // Users can switch between Hindi and English
  if (language === 'auto') {
    // Try Hindi first, as it's the primary language we want to support
    recognition.lang = 'hi-IN';
  } else {
    recognition.lang = language;
  }

  (recognition as any).maxAlternatives = 1;

  let timeoutId: any = null;
  const clearTimer = () => { if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; } };

  recognition.onstart = () => {
    console.log('Speech recognition started with language:', recognition.lang);
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
    if (t) {
      console.log('Recognized text:', t, 'Language:', recognition.lang);
      onResult(t);
    }
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

    // If language-not-supported error and we were trying Hindi, fallback to English
    if (event.error === 'language-not-supported' && recognition.lang === 'hi-IN') {
      console.warn('Hindi not supported, falling back to English');
      // Retry with English
      setTimeout(() => {
        startSpeechRecognition(onResult, onError, 'en-US');
      }, 100);
      return;
    }

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
