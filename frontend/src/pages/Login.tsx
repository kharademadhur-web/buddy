import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = (import.meta as ImportMeta).env?.VITE_API_BASE as string | undefined || '';
const CLIENT_ID = (import.meta as ImportMeta).env?.VITE_GOOGLE_CLIENT_ID as string | undefined || '';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // In local dev, skip the Google widget and redirect users to Chat directly.
  useEffect(() => {
    if (import.meta.env.DEV) navigate('/chat', { replace: true });
  }, [navigate]);

  const onSuccess = async (credential: string) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      login(data.access_token, data.user);
      navigate('/chat', { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const showGoogle = !import.meta.env.DEV && !!CLIENT_ID;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in to Buddy AI</h1>
          <p className="text-gray-600">Welcome back! Continue with Google to start chatting.</p>
        </div>

        {error && <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>}

        <div className="flex flex-col gap-3">
          {showGoogle ? (
            <GoogleLogin
              onSuccess={(cred) => cred.credential && onSuccess(cred.credential)}
              onError={() => setError('Google login failed')}
              theme="outline"
              shape="pill"
              logo_alignment="left"
              width="320"
            />
          ) : (
            <div className="text-center text-sm text-gray-500">Google login disabled in local dev. Go to Chat to continue.</div>
          )}
          {loading && <div className="text-center text-sm text-gray-500">Signing you in…</div>}
        </div>

        <div className="text-center text-xs text-gray-500">Protected by Google OAuth • Secure JWT session</div>
      </div>
    </div>
  );
}
