import React, { useState, useEffect } from 'react';
import { startSpeechRecognition, stopSpeech } from '../voice';
import AnimatedGalaxy from './AnimatedGalaxy';

interface VoiceSessionOverlayProps {
  open: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
  spokenText?: string;
  currentCharIndex?: number;
  language?: 'en-US' | 'hi-IN' | 'auto';
}

/**
 * Full-screen voice session UI: big animated orb, End Session label, cancel + mic buttons.
 * Used when the user taps "I need to talk".
 */
export default function VoiceSessionOverlay({
  open,
  onClose,
  onTranscript,
  spokenText,
  currentCharIndex = -1,
  language = 'en-US'
}: VoiceSessionOverlayProps) {
  const [isListening, setIsListening] = useState(false);
  const [userStopped, setUserStopped] = useState(false);

  // Auto-start listening when overlay opens
  useEffect(() => {
    if (open && !isListening && !userStopped) {
      // Small delay to ensure overlay is fully rendered
      const timer = setTimeout(() => {
        startListening();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!open) return null;

  const startListening = () => {
    setUserStopped(false);
    setIsListening(true);
    startSpeechRecognition(
      (text) => {
        setIsListening(false);
        if (text.trim()) {
          onTranscript(text);
          // Auto-restart listening after processing the transcript
          setTimeout(() => {
            if (!userStopped) {
              startListening();
            }
          }, 500);
        }
      },
      (err) => {
        // Ignore 'aborted' as it usually means we stopped it or it was interrupted by another start
        if (err === 'aborted') {
          return;
        }

        console.error('Voice session STT error:', err);
        setIsListening(false);

        // Don't auto-retry on network errors to avoid infinite loops
        // Only retry on no-speech if user hasn't stopped
        if (!userStopped && err === 'no-speech') {
          setTimeout(() => {
            if (!userStopped) startListening();
          }, 500);
        }
      },
      language // Pass the selected language
    );
  };

  const handleMicClick = () => {
    if (isListening) {
      // If clicking while listening, stop it.
      setIsListening(false);
      setUserStopped(true);
      stopSpeech();
    } else {
      startListening();
    }
  };

  const handleEndSession = () => {
    setUserStopped(true);
    stopSpeech();
    setIsListening(false);
    onClose();
  };

  const handleCancel = () => {
    setUserStopped(true);
    stopSpeech();
    setIsListening(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 bg-white flex flex-col">
      {/* Top bar with simple settings icon placeholder */}
      <div className="flex items-center justify-end px-6 py-4">
        <button
          type="button"
          aria-label="Close voice session"
          onClick={handleCancel}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
        >
          <span className="text-xl">×</span>
        </button>
      </div>

      {/* Center animated galaxy */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="w-80 h-80 relative mb-8">
          <AnimatedGalaxy isListening={isListening} />
        </div>

        {/* Subtitles / Spoken Text */}
        {spokenText && (
          <div className="px-8 max-w-3xl text-center">
            <p className="text-2xl font-medium text-slate-700 leading-relaxed transition-all duration-200">
              {spokenText.split(' ').map((word, i) => {
                // Simple estimation: if we have char index, we can try to find which word it is.
                // But splitting by space is imperfect.
                // A better way is to just highlight everything up to currentCharIndex.
                // Let's try to highlight the "current" word based on char index.

                // Reconstruct the text to find word boundaries
                // This is complex to do perfectly in React render.
                // Simplified approach: Render full text, and style a span based on char index range.
                return null;
              })}
              {/* Better approach: Render text and use a mask or just simple text for now if highlighting is hard */}

              {/* Let's try a simpler highlighting: just show the text. 
                  If we want "description of every word", maybe just showing the text is enough?
                  The user said "description of every word". 
                  Let's try to highlight the word being spoken.
              */}
            </p>
            <div className="text-2xl font-medium text-slate-700 leading-relaxed">
              {(() => {
                if (currentCharIndex === -1) return spokenText;
                const before = spokenText.slice(0, currentCharIndex);
                // Find the end of the current word
                const rest = spokenText.slice(currentCharIndex);
                const wordEnd = rest.search(/\s/) === -1 ? rest.length : rest.search(/\s/);
                const current = rest.slice(0, wordEnd);
                const after = rest.slice(wordEnd);

                return (
                  <>
                    <span className="text-slate-400">{before}</span>
                    <span className="text-slate-900 scale-110 inline-block transition-transform">{current}</span>
                    <span className="text-slate-400">{after}</span>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="pb-10 flex flex-col items-center gap-4">
        <div className="px-4 py-1 rounded-full bg-black text-white text-sm">End Session</div>
        <div className="flex items-center gap-14">
          <button
            type="button"
            onClick={handleCancel}
            className="w-14 h-14 rounded-full border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100"
          >
            <span className="text-xl">×</span>
          </button>
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isListening}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-md transition-colors ${isListening ? 'bg-red-500' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            aria-label={isListening ? 'Listening…' : 'Start talking'}
          >
            <span className="text-xl">🎤</span>
          </button>
        </div>
      </div>
    </div>
  );
}
