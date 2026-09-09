import { useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import {
  Sparkles,
  LayoutDashboard,
  Wand2,
  BookMarked,
  FolderOpen,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export type Page = 'dashboard' | 'generator' | 'library' | 'content';

type NavItem = {
  id: Page;
  label: string;
  icon: typeof LayoutDashboard;
};

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'generator', label: 'Generator', icon: Wand2 },
  { id: 'library', label: 'Prompt Library', icon: BookMarked },
  { id: 'content', label: 'History', icon: FolderOpen },
];

export default function Layout({
  current,
  onNavigate,
  children,
}: {
  current: Page;
  onNavigate: (p: Page) => void;
  children: ReactNode;
}) {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (p: Page) => {
    onNavigate(p);
    setMobileOpen(false);
  };

  const email = user?.email ?? '';

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 bg-white border-r border-brand-lightPurple/60 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-5 border-b border-brand-lightPurple/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-gray-900 text-lg leading-none">
                SmartContent
                <span className="block text-xs font-semibold text-brand-pink mt-0.5">
                  AI Platform
                </span>
              </span>
            </div>
            <button
              className="lg:hidden text-gray-400 hover:text-gray-600"
              onClick={() => setMobileOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = current === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-gradient-to-r from-brand-purple/10 to-brand-pink/10 text-brand-purple shadow-sm'
                      : 'text-gray-600 hover:bg-brand-lightPurple/20 hover:text-brand-purple'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-brand-lightPurple/40">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-softPink to-brand-lightPurple flex items-center justify-center text-sm font-bold text-brand-purple">
                {email.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">{email}</p>
                <p className="text-[11px] text-gray-400">Signed in</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between bg-white/80 backdrop-blur border-b border-brand-lightPurple/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">SmartContent AI</span>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
