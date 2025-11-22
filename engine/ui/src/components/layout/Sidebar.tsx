import { Home, Server, Cloud, FileText, Activity, Settings, Terminal } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { ThemeSwitcher } from '../common/ThemeSwitcher';

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  emoji: string;
  shortcut?: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', icon: Home, path: '/', emoji: '📊', shortcut: '⌘1' },
  { name: 'Services', icon: Server, path: '/services', emoji: '🔧', shortcut: '⌘2' },
  { name: 'Cloud Emulators', icon: Cloud, path: '/cloud', emoji: '☁️', shortcut: '⌘3' },
  { name: 'Monitoring', icon: Activity, path: '/monitoring', emoji: '📈', shortcut: '⌘4' },
  { name: 'Logs', icon: Terminal, path: '/logs', emoji: '📝', shortcut: '⌘5' },
  { name: 'Configuration', icon: FileText, path: '/config', emoji: '📄', shortcut: '⌘6' },
  { name: 'Settings', icon: Settings, path: '/settings', emoji: '⚙️', shortcut: '⌘,' },
];

interface SidebarProps {
  projectName?: string;
  projectPath?: string;
  onSelectProject?: (path: string) => void;
  onNewProject?: () => void;
  onOpenProject?: () => void;
  servicesCount?: number;
  runningServicesCount?: number;
}

export function Sidebar({ }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className="flex h-screen w-20 flex-col bg-slate-900/50 backdrop-blur-xl border-r border-white/10 z-50"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo Icon */}
      <div className="flex h-20 items-center justify-center border-b border-white/10 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg hover-scale cursor-pointer transition-transform">
          <span className="text-2xl select-none">📦</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-3" aria-label="Primary navigation">
        {navigation.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={clsx(
                'group relative flex h-12 w-12 mx-auto items-center justify-center rounded-xl transition-all duration-300',
                isActive
                  ? 'bg-blue-500/20 text-white shadow-glow'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white hover-lift'
              )}
              aria-current={isActive ? 'page' : undefined}
              title={item.name}
            >
              <span className="text-2xl transition-transform group-hover:scale-110" aria-hidden="true">
                {item.emoji}
              </span>

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-glow" />
              )}

              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-white/10 flex items-center gap-3">
                <span className="font-medium">{item.name}</span>
                {item.shortcut && (
                  <span className="text-xs text-gray-400 bg-white/10 px-1.5 py-0.5 rounded border border-white/10 font-mono">
                    {item.shortcut}
                  </span>
                )}
                {/* Arrow */}
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 border-l border-b border-white/10 transform rotate-45" />
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-white/10 flex flex-col gap-3 items-center">
        <ThemeSwitcher />
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all hover-scale"
          aria-label="Help & Documentation"
        >
          <span className="text-xl">❓</span>
        </button>
      </div>
    </aside>
  );
}
