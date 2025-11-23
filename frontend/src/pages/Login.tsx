import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loginDemo } from '../api';

const API_BASE = (import.meta as any).env?.VITE_API_BASE as string | undefined || '';
const CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string | undefined || '423787673770-pu2bgl97aovjfgee70chpflsh98c3jnu.apps.googleusercontent.com';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  // Check if user was redirected from a protected route
  useEffect(() => {
    const token = localStorage.getItem('buddy_token');
    // If user already has a valid token, redirect to chat
    if (token) {
      navigate('/chat', { replace: true });
    }
    // Removed auto-redirect in dev mode to allow proper login testing
  }, [navigate]);

  const onSuccess = async (credential: string) => {
    setLoading(true); setError('');
    try {
      console.log('Attempting Google login to:', `${API_BASE}/api/auth/google`);

      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error('Google auth error:', res.status, errorText);
        throw new Error(`Backend error: ${res.status} - ${errorText || 'Check if backend server is running on port 8000'}`);
      }

      const data = await res.json();
      login(data.access_token, data.user);
      navigate('/chat', { replace: true });
    } catch (e: any) {
      console.error('Login error:', e);
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const continueAsGuest = async () => {
    setGuestLoading(true);
    setError('');
    try {
      const data = await loginDemo();
      login(data.access_token, { id: 0, email: 'guest@buddy.local', name: 'Guest', picture_url: null });
      navigate('/chat', { replace: true });
    } catch (e: any) {
      console.error('Guest login error:', e);
      setError(e?.message || 'Guest login failed. Please check your connection.');
    } finally {
      setGuestLoading(false);
    }
  };

  const showGoogle = !!CLIENT_ID; // Show Google login if CLIENT_ID is configured (works in both dev and prod)

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in to Buddy AI</h1>
          <p className="text-gray-600">Use Google or continue as guest to start chatting.</p>
        </div>

        {error && <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>}

        <div className="flex flex-col gap-3">
          {showGoogle && (
            <GoogleLogin
              onSuccess={(cred) => cred.credential && onSuccess(cred.credential)}
              onError={() => {
                console.error('Google login error');
                setError('Google Sign-In Failed: check browser console for details');
              }}
              theme="outline"
              shape="pill"
              logo_alignment="left"
              width="320"
            />
          )}

          <button
            onClick={continueAsGuest}
            className="w-full py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
            disabled={guestLoading}
          >
            {guestLoading ? 'Continuing…' : 'Continue as Guest'}
          </button>

          {loading && <div className="text-center text-sm text-gray-500">Signing you in…</div>}
        </div>

        <div className="text-center text-xs text-gray-500">Protected by Google OAuth • Or use guest mode</div>
      </div>
    </div>
  );
}
