import { useState, useEffect } from 'react';
import { listConversations, getConversation, deleteConversationApi, type ConversationBrief, type MessageOut } from '../api';

export default function HistoryPanel() {
  const [conversations, setConversations] = useState<ConversationBrief[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<MessageOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await listConversations();
        setConversations(list);
      } catch (e: any) {
        setError(e?.message || 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onSelect = async (id: number) => {
    setSelectedId(id);
    setLoading(true);
    try {
      const conv = await getConversation(id);
      setSelectedMessages(conv.messages);
    } catch (e: any) {
      setError(e?.message || 'Failed to load conversation');
      setSelectedMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: number) => {
    try {
      await deleteConversationApi(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setSelectedMessages([]);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to delete');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* List */}
      <div className="lg:col-span-1 space-y-3">
        <h2 className="text-xl font-semibold">Conversation History</h2>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {loading && !conversations.length && <div className="text-gray-500 text-sm">Loading…</div>}
        {conversations.map(c => (
          <div
            key={c.id}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              selectedId === c.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelect(c.id)}
          >
            <div className="font-medium text-gray-900 truncate">{c.title || 'Untitled'}</div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(c.created_at).toLocaleString()}
            </div>
            <button
              className="mt-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
              onClick={e => {
                e.stopPropagation();
                onDelete(c.id);
              }}
              title="Delete conversation"
            >
              Delete
            </button>
          </div>
        ))}
        {conversations.length === 0 && !loading && (
          <div className="text-gray-500 text-sm">No conversations yet.</div>
        )}
      </div>

      {/* Detail */}
      <div className="lg:col-span-2">
        {selectedId === null ? (
          <div className="text-gray-500 text-center py-12">Select a conversation to view its messages.</div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Messages</h3>
            {loading ? (
              <div className="text-gray-500 text-sm">Loading conversation…</div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {selectedMessages.map(m => (
                  <div key={m.id} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'}`}>
                    <div className="text-xs text-gray-500 mb-1">
                      {m.role} · {new Date(m.created_at).toLocaleString()}
                    </div>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                ))}
                {selectedMessages.length === 0 && <div className="text-gray-500 text-sm">No messages in this conversation.</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}