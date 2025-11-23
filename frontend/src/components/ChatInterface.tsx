import { useEffect, useRef, useState } from 'react';
import { chat, ChatResponse, listConversations, getConversation, deleteConversationApi, type ConversationBrief, type MessageOut } from '../api';
import ConversationSidebar from './ConversationSidebar';
import VoiceControls, { type VoiceControlsHandle } from './VoiceControls';
import VoiceSessionOverlay from './VoiceSessionOverlay';
import { textToSpeech, initializeVoices } from '../voice';

type Msg = { role: 'user' | 'assistant'; content: string; timestamp: Date; emotion?: any };

export default function ChatInterface() {
  const [conversations, setConversations] = useState<ConversationBrief[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const voiceRef = useRef<VoiceControlsHandle | null>(null);
  const [voiceSessionOpen, setVoiceSessionOpen] = useState(false);

  const refreshConversations = async () => {
    try {
      const list = await listConversations();
      setConversations(list);
    } catch { }
  };

  useEffect(() => {
    void refreshConversations();
    // Initialize voice engines
    initializeVoices();
  }, []);

  const loadConversation = async (id: number) => {
    try {
      const conv = await getConversation(id);
      setActiveId(id);
      const mapped: Msg[] = conv.messages
        .filter(m => ['user', 'assistant'].includes(m.role))
        .map((m: MessageOut) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at)
        }));
      setMessages(mapped);
    } catch { }
  };

  const newConversation = () => {
    setActiveId(null);
    setMessages([]);
  };

  const deleteConversation = async (id: number) => {
    try { await deleteConversationApi(id); await refreshConversations(); if (activeId === id) newConversation(); } catch { }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: 'user', content: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    const text = input;
    setInput('');
    setLoading(true);
    try {
      const res: ChatResponse = await chat(text, true, activeId ?? undefined);
      // If new conversation created, set it active and refresh list
      const convIdNum = Number(res.conversation_id);
      if (!activeId && !Number.isNaN(convIdNum)) {
        setActiveId(convIdNum);
        void refreshConversations();
      }
      const aiMsg: Msg = { role: 'assistant', content: res.response, emotion: res.emotion, timestamp: new Date() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error: ' + (e?.message || 'Unknown'), timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSubmit = async (text: string): Promise<string> => {
    setInput(text); // Set the transcribed text
    return new Promise((resolve, reject) => {
      // Simulate a chat message with voice input
      (async () => {
        try {
          setLoading(true);
          const userMsg: Msg = { role: 'user', content: text, timestamp: new Date() };
          setMessages((prev) => [...prev, userMsg]);

          const res: ChatResponse = await chat(text, true, activeId ?? undefined);

          // Update conversation ID if new
          const convIdNum = Number(res.conversation_id);
          if (!activeId && !Number.isNaN(convIdNum)) {
            setActiveId(convIdNum);
            void refreshConversations();
          }

          const aiMsg: Msg = { role: 'assistant', content: res.response, emotion: res.emotion, timestamp: new Date() };
          setMessages((prev) => [...prev, aiMsg]);

          resolve(res.response);
        } catch (e: any) {
          const errorMsg = 'Error: ' + (e?.message || 'Unknown');
          setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg, timestamp: new Date() }]);
          reject(errorMsg);
        } finally {
          setLoading(false);
        }
      })();
    });
  };

  const handleVoiceTranscript = (text: string) => {
    setInput(text);
    if (!loading && text.trim()) {
      void sendMessageWithText(text);
    }
  };

  const [spokenText, setSpokenText] = useState<string>('');
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);

  const handleVoiceSpeak = (text: string) => {
    if (voiceEnabled && text) {
      setSpokenText(text);
      setCurrentWordIndex(-1);

      textToSpeech(
        text,
        () => {
          // Speech completed
          setSpokenText('');
          setCurrentWordIndex(-1);
        },
        (event) => {
          // On boundary (word)
          if (event.name === 'word') {
            // charIndex is the character index in the text
            // We can use this to highlight, but for now let's just pass the charIndex
            // or try to estimate word index. 
            // Actually, let's just pass the charIndex to the overlay and let it handle highlighting
            setCurrentWordIndex(event.charIndex);
          }
        }
      );
    }
  };

  const sendMessageWithText = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    const textToSend = text;
    setInput('');

    setLoading(true);
    try {
      const res: ChatResponse = await chat(textToSend, true, activeId ?? undefined);

      // If new conversation created, set it active and refresh list
      const convIdNum = Number(res.conversation_id);
      if (!activeId && !Number.isNaN(convIdNum)) {
        setActiveId(convIdNum);
        void refreshConversations();
      }

      const aiMsg: Msg = { role: 'assistant', content: res.response, emotion: res.emotion, timestamp: new Date() };
      setMessages((prev) => [...prev, aiMsg]);
      if (voiceEnabled && res.response) {
        handleVoiceSpeak(res.response);
      }
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error: ' + (e?.message || 'Unknown'), timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
      {showSidebar && (
        <ConversationSidebar conversations={conversations} activeId={activeId} onSelect={loadConversation} onNew={newConversation} onDelete={deleteConversation} />
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: showSidebar ? 0 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <button
            onClick={() => setShowSidebar(s => !s)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}
            aria-label={showSidebar ? "Hide conversation list" : "Show conversation list"}
          >
            ☰
          </button>
          {activeId && <div style={{ color: '#6b7280' }}>Conversation #{activeId}</div>}
          <div />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: 12 }}>
          {messages.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', marginTop: 40 }}>
              <div style={{ fontSize: 18, marginBottom: 8 }}>👋 Hello! I'm Buddy.</div>
              <div>Ask me anything, paste notes, or start a voice session.</div>
              <div style={{ marginTop: 8 }}>
                <button onClick={() => setVoiceSessionOpen(true)} style={{ padding: '8px 12px', borderRadius: 8, background: '#e0f2fe', color: '#0c4a6e', border: '1px solid #bae6fd' }}>💙 I need to talk</button>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                <div style={{
                  maxWidth: '70%',
                  background: m.role === 'user' ? '#2563eb' : '#f8fafc',
                  color: m.role === 'user' ? '#fff' : '#111',
                  border: m.role === 'user' ? 'none' : '1px solid #e5e5e5',
                  padding: 10,
                  borderRadius: 8
                }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  {m.emotion && (
                    <div style={{ marginTop: 8, fontSize: 12, color: m.role === 'user' ? '#e0e7ff' : '#334155' }}>
                      Emotion: {m.emotion.label || m.emotion.emotion || 'unknown'} {typeof m.emotion.confidence === 'number' ? `(${Math.round(m.emotion.confidence * 100)}%)` : ''}
                    </div>
                  )}
                  <div style={{ marginTop: 6, fontSize: 11, opacity: 0.7 }}>{m.timestamp.toLocaleTimeString()}</div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#334155' }}>Buddy is typing…</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setVoiceSessionOpen(true)} style={{ padding: '6px 10px', borderRadius: 8, background: '#e0f2fe', color: '#0c4a6e', border: '1px solid #bae6fd' }}>
              💙 I need to talk
            </button>
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message or tap microphone..."
            style={{ flex: 1, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8 }}
            disabled={loading}
          />
          <VoiceControls ref={voiceRef} onTranscript={handleVoiceTranscript} onSpeak={handleVoiceSpeak} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#6b7280' }}>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                style={{ marginRight: '4px' }}
              />
              Voice Replies
            </label>
          </div>
          <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ padding: '10px 14px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Send
          </button>
        </div>
      </div>
      {/* Full-screen voice session overlay */}
      <VoiceSessionOverlay
        open={voiceSessionOpen}
        onClose={() => {
          setVoiceSessionOpen(false);
          setSpokenText(''); // Clear text when closing
        }}
        onTranscript={handleVoiceTranscript}
        spokenText={spokenText}
        currentCharIndex={currentWordIndex}
      />
    </div>
  );
}
