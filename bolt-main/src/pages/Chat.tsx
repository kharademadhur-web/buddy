import { useState, useEffect, useRef } from 'react';
import { Send, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Chat() {
  const { user } = useAuth();
  const {
    conversations,
    messages,
    currentConversationId,
    setCurrentConversationId,
    createConversation,
    deleteConversation,
    sendMessage,
    loadMessages,
  } = useApp();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    }
  }, [currentConversationId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = async () => {
    const id = await createConversation();
    if (id) {
      setCurrentConversationId(id);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentConversationId) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      await sendMessage(userMessage);

      setTimeout(async () => {
        const emotions = ['joy', 'calm', 'supportive', 'empathetic', 'encouraging'];
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];

        const responses = [
          "I hear you, and I'm here to support you through this.",
          "Thank you for sharing that with me. How does that make you feel?",
          "That sounds important to you. Tell me more about it.",
          "I appreciate you opening up. What would help you most right now?",
          "Your feelings are valid. Let's explore this together.",
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];

        await supabase
          .from('messages')
          .insert({
            conversation_id: currentConversationId,
            user_id: user!.id,
            role: 'assistant',
            content: response,
            emotion: randomEmotion,
            emotion_intensity: 0.7 + Math.random() * 0.3,
          });

        await loadMessages(currentConversationId);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this conversation?')) {
      await deleteConversation(id);
    }
  };

  const getEmotionColor = (emotion?: string | null) => {
    const colors: Record<string, string> = {
      joy: 'bg-yellow-100 text-yellow-800',
      calm: 'bg-blue-100 text-blue-800',
      supportive: 'bg-green-100 text-green-800',
      empathetic: 'bg-purple-100 text-purple-800',
      encouraging: 'bg-orange-100 text-orange-800',
    };
    return colors[emotion || ''] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-4 overflow-y-auto">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg font-medium hover:from-amber-500 hover:to-orange-600 transition-all shadow-md mb-4"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>

          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                  currentConversationId === conv.id
                    ? 'bg-orange-50 border-2 border-orange-300'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
                onClick={() => setCurrentConversationId(conv.id)}
              >
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                  {conv.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!currentConversationId ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Select a conversation or start a new chat</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Start your conversation...</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {msg.emotion && (
                      <span
                        className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${getEmotionColor(
                          msg.emotion
                        )}`}
                      >
                        {msg.emotion}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Share your thoughts..."
                disabled={!currentConversationId || isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:bg-gray-100"
              />
              <button
                onClick={handleSend}
                disabled={!currentConversationId || !input.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg hover:from-amber-500 hover:to-orange-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
