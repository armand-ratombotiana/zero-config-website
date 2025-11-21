import { Home, Server, Cloud, FileText, Activity, Settings, Terminal, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', icon: Home, path: '/' },
  { name: 'Services', icon: Server, path: '/services' },
  { name: 'Cloud Emulators', icon: Cloud, path: '/cloud' },
  { name: 'Monitoring', icon: Activity, path: '/monitoring' },
  { name: 'Logs', icon: Terminal, path: '/logs' },
  { name: 'Configuration', icon: FileText, path: '/config' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside
      className="flex h-screen w-64 flex-col glass-card rounded-none border-r border-l-0 border-t-0 border-b-0"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-accent shadow-accent">
            <Zap className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">ZeroConfig</h1>
            <p className="text-xs text-muted">Dev Environment</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Primary navigation">
        {navigation.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`h-5 w-5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-muted group-hover:text-white'
                }`}
                aria-hidden="true"
              />
              <span>{item.name}</span>
              {item.badge && (
                <span className="ml-auto badge badge-info text-xs">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Status Bar */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Runtime Status</span>
          <div className="flex items-center space-x-1">
            <div className="status-dot status-dot-running" aria-label="Running"></div>
            <span className="text-success">Active</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-9 w-9 rounded-full bg-gradient-accent flex items-center justify-center shadow-accent/50">
              <span className="text-sm font-semibold text-white">U</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Developer</p>
            <p className="text-xs text-muted truncate">Local Environment</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
