import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type User = { id: number; email?: string | null; name?: string | null; picture_url?: string | null };

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('buddy_token');
    const u = localStorage.getItem('buddy_user');
    if (t) setToken(t);
    if (u) try { setUser(JSON.parse(u)); } catch {}
  }, []);

  const login = (t: string, u: User) => {
    setToken(t);
    setUser(u);
    localStorage.setItem('buddy_token', t);
    localStorage.setItem('buddy_user', JSON.stringify(u));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('buddy_token');
    localStorage.removeItem('buddy_user');
  };

  const value = useMemo(() => ({ user, token, login, logout, isAuthenticated: !!token }), [user, token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
