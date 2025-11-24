import { useEffect, useRef, useState } from 'react';
import { chat, ChatResponse, listConversations, getConversation, deleteConversationApi, type ConversationBrief, type MessageOut } from '../api';
import ConversationSidebar from './ConversationSidebar';
import VoiceControls, { type VoiceControlsHandle } from './VoiceControls';
import VoiceSessionOverlay from './VoiceSessionOverlay';
import Onboarding from './Onboarding';
import { textToSpeech, initializeVoices } from '../voice';
import { Send, Mic, Volume2, VolumeX, Globe, Menu, MessageSquare, HelpCircle } from 'lucide-react';

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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi' | 'auto'>('auto');

  // Check for first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('buddy_has_visited');
    if (!hasVisited) {
      setShowOnboarding(true);
      localStorage.setItem('buddy_has_visited', 'true');
    }
  }, []);

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

      // Auto-speak if voice enabled
      if (voiceEnabled && res.response) {
        handleVoiceSpeak(res.response);
      }
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
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      {/* Sidebar */}
      {showSidebar && (
        <ConversationSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={loadConversation}
          onNew={newConversation}
          onDelete={deleteConversation}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(s => !s)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              aria-label={showSidebar ? "Hide conversation list" : "Show conversation list"}
              title={showSidebar ? "Hide Sidebar" : "Show Sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>

            {activeId && (
              <div className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                Conversation #{activeId}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="hidden md:flex items-center gap-2 mr-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
              <Globe className="w-4 h-4 text-gray-500 ml-2" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent text-sm text-gray-700 focus:outline-none cursor-pointer py-1 pr-2"
                aria-label="Select Language"
              >
                <option value="auto">Auto-Detect</option>
                <option value="en">English</option>
                <option value="hi">Hindi (हिन्दी)</option>
              </select>
            </div>

            <button
              onClick={() => setShowOnboarding(true)}
              className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
              aria-label="Show help"
              title="Help & Tips"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <MessageSquare className="w-10 h-10 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Hello! I'm Buddy.</h2>
              <p className="text-gray-500 max-w-md mb-8">
                I'm here to listen, chat, and help you organize your thoughts.
                Ask me anything or start a voice session!
              </p>

              <button
                onClick={() => setVoiceSessionOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                aria-label="Start voice session"
              >
                <span>💙 I need to talk</span>
              </button>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`
                    max-w-[80%] md:max-w-[70%] p-4 rounded-2xl shadow-sm
                    ${m.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}
                  `}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

                  {m.emotion && (
                    <div className={`mt-3 text-xs flex items-center gap-1 ${m.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                      <span>✨ Emotion: {m.emotion.label || m.emotion.emotion || 'unknown'}</span>
                      {typeof m.emotion.confidence === 'number' && (
                        <span className="opacity-75">({Math.round(m.emotion.confidence * 100)}%)</span>
                      )}
                    </div>
                  )}

                  <div className={`mt-1 text-[10px] ${m.role === 'user' ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none text-gray-500 text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setVoiceSessionOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-sm font-medium transition-colors border border-sky-100"
              aria-label="Open full screen voice mode"
            >
              <span>💙 Voice Mode</span>
            </button>
          </div>

          <div className="flex gap-2 items-end bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <VoiceControls ref={voiceRef} onTranscript={handleVoiceTranscript} onSpeak={handleVoiceSpeak} />

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 py-2.5 px-2 text-gray-700 placeholder-gray-400"
              rows={1}
              aria-label="Message input"
              disabled={loading}
            />

            <div className="flex items-center gap-1 pb-1">
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-2 rounded-lg transition-colors ${voiceEnabled ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:bg-gray-200'}`}
                aria-label={voiceEnabled ? "Disable voice replies" : "Enable voice replies"}
                title={voiceEnabled ? "Voice replies on" : "Voice replies off"}
              >
                {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                aria-label="Send message"
                title="Send Message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="text-center mt-2 text-xs text-gray-400">
            Buddy AI can make mistakes. Consider checking important information.
          </div>
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

      {/* Onboarding Modal */}
      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
    </div>
  );
}
