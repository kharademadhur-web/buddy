const API_BASE = (import.meta as ImportMeta).env?.VITE_API_BASE as string | undefined || '';

export type Heading = { level: number; text: string };
export type OrganizeResponse = { headings: Heading[]; topics: string[]; categories: string[]; emotions?: { label: string; confidence: number } | null };
export type ChatResponse = { response: string; emotion?: any; conversation_id: string; model: string };

export type ConversationBrief = { id: number; title: string; created_at: string; updated_at?: string | null };
export type MessageOut = { id: number; role: 'system' | 'user' | 'assistant'; content: string; created_at: string };
export type ConversationDetail = { id: number; title: string; messages: MessageOut[] };

export async function organizeNotes(text: string, detectEmotion: boolean = true) {
  const res = await fetch(`${API_BASE}/api/notes/organize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, detect_emotion: detectEmotion })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<OrganizeResponse>;
}

export async function chat(message: string, detectEmotion: boolean = true, conversationId?: number | string) {
  const res = await fetch(`${API_BASE}/api/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, detect_emotion: detectEmotion, conversation_id: conversationId ? String(conversationId) : undefined })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<ChatResponse>;
}

export async function listConversations() {
  const res = await fetch(`${API_BASE}/api/conversations`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<ConversationBrief[]>;
}

export async function getConversation(id: number) {
  const res = await fetch(`${API_BASE}/api/conversations/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<ConversationDetail>;
}

export async function deleteConversationApi(id: number) {
  const res = await fetch(`${API_BASE}/api/conversations/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
}

// Emotion endpoints
export async function emotionOrganize(user_id: string, message: string, emotion?: string, emotion_confidence?: number) {
  const res = await fetch(`${API_BASE}/api/emotion/organize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, message, emotion, emotion_confidence })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function emotionSummary(user_id: string, days: number = 7) {
  const res = await fetch(`${API_BASE}/api/emotion/summary?user_id=${encodeURIComponent(user_id)}&days=${days}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function emotionCategories(user_id: string) {
  const res = await fetch(`${API_BASE}/api/emotion/categories?user_id=${encodeURIComponent(user_id)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function emotionSearch(user_id: string, keyword: string, category?: string) {
  const url = new URL(`${API_BASE}/api/emotion/search`);
  url.searchParams.set('user_id', user_id);
  url.searchParams.set('keyword', keyword);
  if (category) url.searchParams.set('category', category);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
