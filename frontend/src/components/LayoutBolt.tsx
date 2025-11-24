import { ReactNode, useState } from 'react';
import { MessageSquare, FileText, Menu, X, Heart } from 'lucide-react';

interface Props {
  children: ReactNode;
  currentPage: 'chat' | 'notes' | 'emotion';
  onNavigate: (page: 'chat' | 'notes' | 'emotion') => void;
}

export default function LayoutBolt({ children, currentPage, onNavigate }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = [
    {
      id: 'chat' as const,
      label: 'Chat',
      icon: MessageSquare,
      description: 'Talk with Buddy AI'
    },
    {
      id: 'notes' as const,
      label: 'Notes',
      icon: FileText,
      description: 'Organize your thoughts'
    },
    {
      id: 'emotion' as const,
      label: 'Emotions',
      icon: Heart,
      description: 'Track your feelings'
    },
  ];

  const handleNavigate = (page: 'chat' | 'notes' | 'emotion') => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all"
        aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        {sidebarOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
      </button>

      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed left-0 top-0 h-full bg-white shadow-2xl z-40 transition-transform duration-300 w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Emotional Buddy</h1>
              <p className="text-xs text-gray-500 truncate">guest@buddy.local</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || (item.id === 'emotion' && currentPage === 'emotion');
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-orange-200'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                aria-label={item.label}
                title={item.description}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-6 border-t border-gray-100">
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <h4 className="text-sm font-semibold text-amber-800 mb-1">Need Help?</h4>
            <p className="text-xs text-amber-600 mb-3">Check our guide for tips.</p>
            <button className="text-xs font-medium text-amber-700 hover:text-amber-900 underline">
              View Documentation
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64 min-h-screen transition-all duration-300">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 h-screen overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}