import { useState, useMemo } from 'react';
import { Search, MessageSquare, FileText, Calendar, Tag } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function History() {
  const { conversations, notes, setCurrentConversationId } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'conversations' | 'notes'>('all');

  const filteredData = useMemo(() => {
    let data: Array<{
      id: string;
      type: 'conversation' | 'note';
      title: string;
      preview: string;
      date: string;
      emotion?: string | null;
      category?: string | null;
    }> = [];

    if (filterType === 'all' || filterType === 'conversations') {
      data = [
        ...data,
        ...conversations.map((conv) => ({
          id: conv.id,
          type: 'conversation' as const,
          title: conv.title,
          preview: 'Click to view conversation',
          date: conv.updated_at,
          emotion: null,
          category: null,
        })),
      ];
    }

    if (filterType === 'all' || filterType === 'notes') {
      data = [
        ...data,
        ...notes.map((note) => ({
          id: note.id,
          type: 'note' as const,
          title: note.title,
          preview: note.content.slice(0, 150),
          date: note.updated_at,
          emotion: note.emotion,
          category: note.category,
        })),
      ];
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        (item) =>
          item.title.toLowerCase().includes(term) ||
          item.preview.toLowerCase().includes(term) ||
          item.emotion?.toLowerCase().includes(term) ||
          item.category?.toLowerCase().includes(term)
      );
    }

    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [conversations, notes, searchTerm, filterType]);

  const handleItemClick = (item: typeof filteredData[0]) => {
    if (item.type === 'conversation') {
      setCurrentConversationId(item.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const groupByDate = (data: typeof filteredData) => {
    const groups: Record<string, typeof filteredData> = {};

    data.forEach((item) => {
      const date = new Date(item.date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else {
        key = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  };

  const groupedData = groupByDate(filteredData);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">History</h1>
        <p className="text-gray-600">Search through your conversations and notes</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations, notes, emotions..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('conversations')}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                filterType === 'conversations'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => setFilterType('notes')}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                filterType === 'notes'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Notes
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
          <span>
            {filteredData.length} {filteredData.length === 1 ? 'result' : 'results'}
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {Object.keys(groupedData).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">No items found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          Object.entries(groupedData).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-700">{date}</h2>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`bg-white rounded-xl shadow-md p-5 transition-all ${
                      item.type === 'conversation' ? 'cursor-pointer hover:shadow-lg hover:scale-[1.01]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          item.type === 'conversation'
                            ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                            : 'bg-gradient-to-br from-green-400 to-green-600'
                        }`}
                      >
                        {item.type === 'conversation' ? (
                          <MessageSquare className="w-5 h-5 text-white" />
                        ) : (
                          <FileText className="w-5 h-5 text-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{item.title}</h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(item.date).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.preview}</p>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              item.type === 'conversation'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {item.type === 'conversation' ? 'Conversation' : 'Note'}
                          </span>

                          {item.emotion && (
                            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {item.emotion}
                            </span>
                          )}

                          {item.category && (
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
