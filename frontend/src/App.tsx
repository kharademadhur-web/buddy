import { useState } from 'react';
import { organizeNotes, OrganizeResponse } from './api';
import ChatInterface from './components/ChatInterface';
import FileUpload from './components/FileUpload';
import LayoutBolt from './components/LayoutBolt';
import EmotionPanel from './components/EmotionPanel';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'emotion'>('chat');

  // Notes state
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrganizeResponse | null>(null);
  const [error, setError] = useState<string>('');

  const onOrganize = async () => {
    setLoading(true); setError('');
    try {
      const r = await organizeNotes(text, true);
      setResult(r);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutBolt currentPage={activeTab} onNavigate={setActiveTab}>
      {activeTab === 'chat' ? (
        <ChatInterface />
      ) : activeTab === 'emotion' ? (
        <EmotionPanel />
      ) : (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Intelligent Note Organization Assistant</h1>
          <p className="text-gray-600">Paste notes below and click Organize to generate headings and topics.</p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your notes here..."
            className="w-full h-52 p-3 border border-gray-300 rounded-lg bg-white"
          />

          <div>
            <button onClick={onOrganize} disabled={loading || !text.trim()} className="px-4 py-2 rounded-lg bg-orange-500 text-white disabled:opacity-50">
              {loading ? 'Organizing...' : 'Organize'}
            </button>
          </div>

          <div>
            <FileUpload onResult={(data) => setResult(data)} />
          </div>

          {error && <div className="text-red-500">Error: {error}</div>}

          {result && (
            <div className="mt-4 space-y-3">
              <h2 className="text-lg font-semibold">Headings</h2>
              <ul className="list-disc list-inside">
                {result.headings.map((h, i) => (
                  <li key={i}>{'H' + h.level}: {h.text}</li>
                ))}
              </ul>
              <h2 className="text-lg font-semibold">Topics</h2>
              <div>{result.topics.join(', ')}</div>
              <h2 className="text-lg font-semibold">Categories</h2>
              <div>{result.categories.join(', ')}</div>
              {result.emotions && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <strong>Detected Emotion:</strong> {result.emotions.label} ({Math.round(result.emotions.confidence * 100)}%)
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </LayoutBolt>
  );
}

// Updated
