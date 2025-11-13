import React from 'react';
import type { ConversationBrief } from '../api';

interface Props {
  conversations: ConversationBrief[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
}

export default function ConversationSidebar({ conversations, activeId, onSelect, onNew, onDelete }: Props) {
  return (
    <div style={{ width: 260, borderRight: '1px solid #e5e5e5', background: '#fff', height: 'calc(100vh - 120px)' }}>
      <div style={{ padding: 12, borderBottom: '1px solid #e5e5e5' }}>
        <button onClick={onNew} style={{ width: '100%', padding: '8px 10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>+ New Chat</button>
      </div>
      <div style={{ overflowY: 'auto', height: '100%' }}>
        {conversations.map(c => (
          <div key={c.id}
               onClick={() => onSelect(c.id)}
               style={{ padding: 10, cursor: 'pointer', background: activeId === c.id ? '#eff6ff' : 'transparent', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ maxWidth: 180 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{c.title}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{new Date(c.created_at).toLocaleString()}</div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
              style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer' }}
              aria-label={`Delete conversation ${c.title || 'Untitled'}`}
              title={`Delete conversation ${c.title || 'Untitled'}`}
            >
              🗑️
            </button>
          </div>
        ))}
        {conversations.length === 0 && (
          <div style={{ padding: 12, color: '#6b7280' }}>No conversations yet.</div>
        )}
      </div>
    </div>
  );
}