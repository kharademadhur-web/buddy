import { useState, useRef } from 'react';
import { Plus, Upload, Save, Trash2, Tag } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function Notes() {
  const { notes, createNote, updateNote, deleteNote } = useApp();
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [heading, setHeading] = useState('');
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentNote = notes.find(n => n.id === selectedNote);

  const handleNewNote = () => {
    setSelectedNote(null);
    setTitle('');
    setContent('');
    setHeading('');
    setTopic('');
    setCategory('');
  };

  const handleSelectNote = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      setSelectedNote(id);
      setTitle(note.title);
      setContent(note.content);
      setHeading(note.heading || '');
      setTopic(note.topic || '');
      setCategory(note.category || '');
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    if (selectedNote) {
      await updateNote(selectedNote, {
        title: title || 'Untitled Note',
        content,
        heading: heading || null,
        topic: topic || null,
        category: category || null,
      });
    } else {
      await createNote(title || 'Untitled Note', content, {
        heading: heading || null,
        topic: topic || null,
        category: category || null,
      });
      handleNewNote();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this note?')) {
      await deleteNote(id);
      if (selectedNote === id) {
        handleNewNote();
      }
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      setTitle(file.name.replace(/\.(txt|md)$/, ''));
    };
    reader.readAsText(file);
  };

  const groupedNotes = notes.reduce((acc, note) => {
    const key = note.category || 'Uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(note);
    return acc;
  }, {} as Record<string, typeof notes>);

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-4 overflow-y-auto">
          <button
            onClick={handleNewNote}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg font-medium hover:from-amber-500 hover:to-orange-600 transition-all shadow-md mb-4"
          >
            <Plus className="w-5 h-5" />
            New Note
          </button>

          <div className="space-y-4">
            {Object.entries(groupedNotes).map(([cat, catNotes]) => (
              <div key={cat}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{cat}</h3>
                <div className="space-y-2">
                  {catNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                        selectedNote === note.id
                          ? 'bg-orange-50 border-2 border-orange-300'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                      onClick={() => handleSelectNote(note.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{note.title}</p>
                        {note.topic && (
                          <p className="text-xs text-gray-500 truncate">{note.topic}</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(note.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-wrap gap-3 mb-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
              <button
                onClick={handleSave}
                disabled={!content.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-md hover:shadow-lg"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  placeholder="Heading"
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Topic"
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Category"
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your note... You can import .txt or .md files using the Import button above."
              className="w-full h-full resize-none border-none focus:outline-none text-gray-700 leading-relaxed"
            />
          </div>

          {currentNote && (
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Created: {new Date(currentNote.created_at).toLocaleDateString()}</span>
                <span>Updated: {new Date(currentNote.updated_at).toLocaleDateString()}</span>
                {currentNote.emotion && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                    {currentNote.emotion}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
