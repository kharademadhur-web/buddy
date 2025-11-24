import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { startSpeechRecognition } from '../voice';
import { Mic, MicOff } from 'lucide-react';

interface VoiceControlsProps {
  onTranscript?: (text: string) => void;
  onSpeak?: (text: string) => void;
  language?: 'en-US' | 'hi-IN' | 'auto';
}

export type VoiceControlsHandle = {
  startListening: () => void;
};

export const VoiceControls = forwardRef<VoiceControlsHandle, VoiceControlsProps>(({
  onTranscript,
  onSpeak,
  language = 'en-US'
}, ref) => {
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    if (isListening) return;
    setIsListening(true);
    const stop = startSpeechRecognition(
      (transcript) => {
        setIsListening(false);
        onTranscript?.(transcript);
      },
      (err) => {
        console.error('STT error:', err);
        setIsListening(false);
      },
      language
    );
  };

  useImperativeHandle(ref, () => ({ startListening }), [isListening]);

  return (
    <button
      onClick={startListening}
      disabled={isListening}
      title={isListening ? "Listening..." : "Start voice input"}
      className={`
        p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center
        ${isListening
          ? 'bg-red-500 text-white animate-pulse shadow-red-200 shadow-lg'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'}
      `}
      aria-label={isListening ? "Stop listening" : "Start listening"}
    >
      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  );
});

export default VoiceControls;
