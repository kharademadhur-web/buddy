import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Database } from '../lib/database.types';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];
type Note = Database['public']['Tables']['notes']['Row'];

interface AppContextType {
  conversations: Conversation[];
  messages: Message[];
  notes: Note[];
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  createConversation: (title?: string) => Promise<string | null>;
  deleteConversation: (id: string) => Promise<void>;
  sendMessage: (content: string, emotion?: string, intensity?: number) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  createNote: (title: string, content: string, metadata?: Partial<Note>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  refreshNotes: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const refreshConversations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setConversations(data);
    }
  };

  const refreshNotes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setNotes(data);
    }
  };

  useEffect(() => {
    if (user) {
      refreshConversations();
      refreshNotes();
    }
  }, [user?.id]);

  const createConversation = async (title = 'New Conversation') => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title,
      })
      .select()
      .single();

    if (!error && data) {
      setConversations([data, ...conversations]);
      return data.id;
    }
    return null;
  };

  const deleteConversation = async (id: string) => {
    await supabase.from('conversations').delete().eq('id', id);
    setConversations(conversations.filter(c => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
      setMessages([]);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const sendMessage = async (content: string, emotion?: string, intensity?: number) => {
    if (!user || !currentConversationId) return;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        user_id: user.id,
        role: 'user',
        content,
        emotion: emotion || null,
        emotion_intensity: intensity || null,
      })
      .select()
      .single();

    if (!error && data) {
      setMessages([...messages, data]);
    }
  };

  const createNote = async (title: string, content: string, metadata?: Partial<Note>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title,
        content,
        ...metadata,
      })
      .select()
      .single();

    if (!error && data) {
      setNotes([data, ...notes]);
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    const { error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id);

    if (!error) {
      setNotes(notes.map(note => note.id === id ? { ...note, ...updates } : note));
    }
  };

  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id);
    setNotes(notes.filter(n => n.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        conversations,
        messages,
        notes,
        currentConversationId,
        setCurrentConversationId,
        createConversation,
        deleteConversation,
        sendMessage,
        loadMessages,
        createNote,
        updateNote,
        deleteNote,
        refreshConversations,
        refreshNotes,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
