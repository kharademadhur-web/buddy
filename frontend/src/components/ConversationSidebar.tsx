import React, { useState, useMemo, useEffect } from 'react';
import type { ConversationBrief } from '../api';
import { Plus, Search, Trash2, MessageSquare, Star, Calendar } from 'lucide-react';

interface Props {
  conversations: ConversationBrief[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
}

export default function ConversationSidebar({ conversations, activeId, onSelect, onNew, onDelete }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});

  // Load favorites from local storage
  useEffect(() => {
    const stored = localStorage.getItem('buddy_favorites');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) { }
    }
  }, []);

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavs = { ...favorites, [id]: !favorites[id] };
    setFavorites(newFavs);
    localStorage.setItem('buddy_favorites', JSON.stringify(newFavs));
  };

  const groupedConversations = useMemo(() => {
    const groups: Record<string, ConversationBrief[]> = {
      'Favorites': [],
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Filter by search term
    const filtered = conversations.filter(c =>
      (c.title || 'Untitled').toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.forEach(c => {
      // Check favorites first
      if (favorites[c.id]) {
        groups['Favorites'].push(c);
        return; // Don't add to date groups if favorite (optional design choice)
      }

      const date = new Date(c.created_at);
      if (date >= today) {
        groups['Today'].push(c);
      } else if (date >= yesterday) {
        groups['Yesterday'].push(c);
      } else if (date >= lastWeek) {
        groups['Previous 7 Days'].push(c);
      } else {
        groups['Older'].push(c);
      }
    });

    return groups;
  }, [conversations, searchTerm, favorites]);

  return (
    <div className="w-80 border-r border-gray-200 bg-gray-50/50 flex flex-col h-full">
      {/* Header & Search */}
      <div className="p-4 border-b border-gray-200 bg-white space-y-3">
        <button
          onClick={onNew}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
          aria-label="Start new chat"
        >
          <Plus className="w-5 h-5" />
          <span>New Chat</span>
        </button>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm transition-all"
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {Object.entries(groupedConversations).map(([group, items]) => (
          items.length > 0 && (
            <div key={group} className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 flex items-center gap-1">
                {group === 'Favorites' && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                {group}
              </h3>
              <div className="space-y-1">
                {items.map(c => (
                  <div
                    key={c.id}
                    onClick={() => onSelect(c.id)}
                    className={`
                      group relative p-3 rounded-xl cursor-pointer transition-all border
                      ${activeId === c.id
                        ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-100'
                        : 'bg-transparent border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm'}
                    `}
                    role="button"
                    tabIndex={0}
                    aria-selected={activeId === c.id}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium truncate ${activeId === c.id ? 'text-blue-700' : 'text-gray-700'}`}>
                          {c.title || 'Untitled Conversation'}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          <span className="mx-1">•</span>
                          {new Date(c.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => toggleFavorite(c.id, e)}
                          className={`p-1.5 rounded-lg hover:bg-amber-50 transition-colors ${favorites[c.id] ? 'text-amber-400 opacity-100' : 'text-gray-400 hover:text-amber-500'}`}
                          aria-label={favorites[c.id] ? "Remove from favorites" : "Add to favorites"}
                          title={favorites[c.id] ? "Unstar" : "Star"}
                        >
                          <Star className={`w-4 h-4 ${favorites[c.id] ? 'fill-amber-400' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Delete conversation"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}

        {conversations.length === 0 && (
          <div className="text-center py-10 px-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm text-gray-500">No conversations yet.</p>
            <p className="text-xs text-gray-400 mt-1">Start a new chat to begin!</p>
          </div>
        )}

        {conversations.length > 0 && Object.values(groupedConversations).every(g => g.length === 0) && (
          <div className="text-center py-10 px-4">
            <p className="text-sm text-gray-500">No matches found.</p>
          </div>
        )}
      </div>
    </div>
  );
}