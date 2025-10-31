import { useEffect, useState } from 'react';
import { chat, ChatResponse, listConversations, getConversation, deleteConversationApi, type ConversationBrief, type MessageOut } from '../api';
import ConversationSidebar from './ConversationSidebar';

type Msg = { role: 'user' | 'assistant'; content: string; timestamp: Date; emotion?: any };

export default function ChatInterface() {
  const [conversations, setConversations] = useState<ConversationBrief[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const refreshConversations = async () => {
    try {
      const list = await listConversations();
      setConversations(list);
    } catch {}
  };

  useEffect(() => {
    void refreshConversations();
  }, []);

  const loadConversation = async (id: number) => {
    try {
      const conv = await getConversation(id);
      setActiveId(id);
      const mapped: Msg[] = conv.messages.map((m: MessageOut) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at)
      }));
      setMessages(mapped);
    } catch {}
  };

  const newConversation = () => {
    setActiveId(null);
    setMessages([]);
  };

  const deleteConversation = async (id: number) => {
    try { await deleteConversationApi(id); await refreshConversations(); if (activeId === id) newConversation(); } catch {}
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

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
      {showSidebar && (
        <ConversationSidebar conversations={conversations} activeId={activeId} onSelect={loadConversation} onNew={newConversation} onDelete={deleteConversation} />
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: showSidebar ? 0 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <button onClick={() => setShowSidebar(s => !s)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>☰</button>
          {activeId && <div style={{ color: '#6b7280' }}>Conversation #{activeId}</div>}
          <div />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: 12 }}>
          {messages.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', marginTop: 40 }}>
              <div style={{ fontSize: 18, marginBottom: 8 }}>👋 Hello! I'm Buddy.</div>
              <div>Ask me anything or paste notes to discuss.</div>
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
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            style={{ flex: 1, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8 }}
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ padding: '10px 14px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
