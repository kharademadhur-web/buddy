import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { startSpeechRecognition } from '../voice';

interface VoiceControlsProps {
  onTranscript?: (text: string) => void;
  onSpeak?: (text: string) => void;
}

export type VoiceControlsHandle = {
  startListening: () => void;
};

export const VoiceControls = forwardRef<VoiceControlsHandle, VoiceControlsProps>(({ onTranscript, onSpeak }, ref) => {
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
      }
    );
  };

  useImperativeHandle(ref, () => ({ startListening }), [isListening]);

  return (
    <button
      onClick={startListening}
      disabled={isListening}
      title="Click to start voice input"
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        background: isListening ? '#ef4444' : '#6b7280',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        fontSize: 16
      }}
    >
      {isListening ? '🎤' : '🎙️'}
    </button>
  );
});

export default VoiceControls;
