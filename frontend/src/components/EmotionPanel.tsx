import { useEffect, useState } from 'react';
import { emotionOrganize, emotionSummary, emotionCategories, emotionSearch } from '../api';
import EmotionChart from './EmotionChart';

export default function EmotionPanel() {
  const [userId] = useState('debug');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [keyword, setKeyword] = useState('');

  const load = async () => {
    try {
      const [s, c] = await Promise.all([
        emotionSummary(userId, 7),
        emotionCategories(userId),
      ]);
      setSummary(s);
      setCategories(c);
    } catch {}
  };
  useEffect(() => { void load(); }, []);

  const onOrganize = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await emotionOrganize(userId, message);
      setMessage('');
      await load();
    } catch (e) {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  const onSearch = async () => {
    try { const r = await emotionSearch(userId, keyword); setResults(r); } catch {}
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-semibold">New Emotional Note</h2>
        <textarea className="w-full h-40 p-3 border border-gray-300 rounded-lg bg-white" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a note (feelings, context, etc.)" />
        <button onClick={onOrganize} disabled={loading || !message.trim()} className="px-4 py-2 rounded-lg bg-orange-500 text-white disabled:opacity-50">
          {loading ? 'Saving…' : 'Save & Categorize'}
        </button>

        <div className="mt-6">
          <h3 className="text-lg font-semibold">Search Notes</h3>
          <div className="flex gap-2 mt-2">
            <input className="flex-1 p-2 border border-gray-300 rounded" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="keyword" />
            <button onClick={onSearch} className="px-3 py-2 bg-gray-800 text-white rounded">Search</button>
          </div>
          <ul className="mt-3 list-disc list-inside">
            {results.map((r, i) => (
              <li key={i}>
                <span className="font-medium">{r.category}</span> / {r.file} — {r.matches} matches
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-white border rounded-lg">
          <h3 className="text-lg font-semibold">Summary (7 days)</h3>
          <div className="text-sm text-gray-600 mt-2">Total: {summary?.total_entries ?? 0}</div>
          <div className="mt-3">
            <EmotionChart counts={summary?.emotions ?? null} percentages={summary?.emotion_percentages ?? null} />
          </div>
        </div>
        <div className="p-4 bg-white border rounded-lg">
          <h3 className="text-lg font-semibold">Categories</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {categories.map((c, i) => (
              <li key={i} className="flex justify-between"><span>{c.name}</span><span>{c.file_count}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}