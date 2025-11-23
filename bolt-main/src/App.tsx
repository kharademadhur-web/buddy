import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Chat from './pages/Chat';
import Notes from './pages/Notes';
import Dashboard from './pages/Dashboard';
import History from './pages/History';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'chat' | 'notes' | 'dashboard' | 'history'>('chat');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <AppProvider>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {currentPage === 'chat' && <Chat />}
        {currentPage === 'notes' && <Notes />}
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'history' && <History />}
      </Layout>
    </AppProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
