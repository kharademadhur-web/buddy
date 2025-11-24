import React, { useState, useEffect, useRef } from 'react';
import { startSpeechRecognition, stopSpeech } from '../voice';
import AnimatedGalaxy from './AnimatedGalaxy';
import { AlertCircle, RefreshCw, Mic, X } from 'lucide-react';

interface VoiceSessionOverlayProps {
  open: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
  spokenText?: string;
  currentCharIndex?: number;
  language?: 'en-US' | 'hi-IN' | 'auto';
}

export default function VoiceSessionOverlay({
  open,
  onClose,
  onTranscript,
  spokenText,
  currentCharIndex = -1,
  language = 'en-US'
}: VoiceSessionOverlayProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const stopRef = useRef<(() => void) | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Auto-start listening when overlay opens
  useEffect(() => {
    if (open) {
      setError(null);
      setRetryCount(0);
      // Small delay to ensure overlay is fully rendered
      const timer = setTimeout(() => {
        if (isMounted.current) startListening();
      }, 500);
      return () => {
        clearTimeout(timer);
        stopSession();
      };
    } else {
      stopSession();
    }
  }, [open, language]);

  const stopSession = () => {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
    stopSpeech();
    setIsListening(false);
  };

  const startListening = () => {
    stopSession(); // Ensure previous session is cleaned up
    setError(null);
    setIsListening(true);

    try {
      stopRef.current = startSpeechRecognition(
        (text) => {
          if (!isMounted.current) return;
          setIsListening(false);
          if (text.trim()) {
            onTranscript(text);
            // Auto-restart listening after processing
            setTimeout(() => {
              if (isMounted.current && open) {
                startListening();
              }
            }, 1000);
          }
        },
        (err) => {
          if (!isMounted.current) return;
          console.error('Voice session error:', err);
          setIsListening(false);

          // Handle specific errors
          if (err === 'no-speech') {
            // If no speech, just restart silently a few times
            if (retryCount < 3) {
              setRetryCount(prev => prev + 1);
              setTimeout(() => {
                if (isMounted.current && open) startListening();
              }, 500);
            } else {
              setError("I didn't hear anything. Click the mic to try again.");
            }
          } else if (err === 'network') {
            setError("Network error. Please check your connection.");
          } else if (err === 'not-allowed' || err === 'permission-denied') {
            setError("Microphone access denied. Please allow access in browser settings.");
          } else if (err === 'aborted') {
            // Ignore aborted
          } else {
            setError(`Error: ${err}. Click mic to retry.`);
          }
        },
        language
      );
    } catch (e: any) {
      console.error("Failed to start speech recognition:", e);
      setError("Could not start microphone. " + e.message);
      setIsListening(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopSession();
    } else {
      startListening();
    }
  };

  const handleClose = () => {
    stopSession();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-200">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-sm absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
          {isListening ? 'Listening...' : 'Paused'}
        </div>
        <button
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="Close voice session"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-4">
        {/* Error Message */}
        {error && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm animate-in slide-in-from-top-4">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="w-64 h-64 md:w-96 md:h-96 relative mb-8 flex items-center justify-center">
          <AnimatedGalaxy isListening={isListening} />
        </div>

        {/* Spoken Text / Subtitles */}
        <div className="max-w-2xl w-full text-center space-y-4 min-h-[100px]">
          {spokenText ? (
            <p className="text-2xl md:text-3xl font-medium text-slate-800 leading-relaxed">
              {spokenText}
            </p>
          ) : (
            <p className="text-xl text-slate-400 font-light">
              {isListening ? "Listening..." : error ? "Stopped" : "Tap the microphone to speak"}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="pb-12 flex flex-col items-center gap-6">
        <button
          onClick={handleMicClick}
          className={`
            w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 scale-100 hover:scale-105 active:scale-95
            ${isListening
              ? 'bg-red-500 text-white shadow-red-200 ring-4 ring-red-100'
              : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800'}
          `}
          aria-label={isListening ? "Stop listening" : "Start listening"}
        >
          {isListening ? (
            <span className="animate-pulse"><Mic className="w-8 h-8" /></span>
          ) : error ? (
            <RefreshCw className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>
        <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">
          {isListening ? "Tap to Stop" : "Tap to Speak"}
        </div>
      </div>
    </div>
  );
}
