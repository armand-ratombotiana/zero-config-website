import { Home, Server, Cloud, FileText, Activity, Settings, Terminal, Zap, ChevronDown, FolderOpen, Plus, Check } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { getRecentProjects, RecentProject } from '../projects/ProjectList';

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string;
  section?: 'main' | 'tools';
}

const navigation: NavItem[] = [
  { name: 'Dashboard', icon: Home, path: '/', section: 'main' },
  { name: 'Services', icon: Server, path: '/services', section: 'main' },
  { name: 'Cloud Emulators', icon: Cloud, path: '/cloud', section: 'main' },
  { name: 'Monitoring', icon: Activity, path: '/monitoring', section: 'tools' },
  { name: 'Logs', icon: Terminal, path: '/logs', section: 'tools' },
  { name: 'Configuration', icon: FileText, path: '/config', section: 'tools' },
  { name: 'Settings', icon: Settings, path: '/settings', section: 'tools' },
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

export function Sidebar({
  projectName,
  projectPath,
  onSelectProject,
  onNewProject,
  onOpenProject,
  servicesCount = 0,
  runningServicesCount = 0,
}: SidebarProps) {
  const location = useLocation();
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentProjects(getRecentProjects());
  }, [projectPath]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProjectMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mainNav = navigation.filter(n => n.section === 'main' || !n.section);
  const toolsNav = navigation.filter(n => n.section === 'tools');

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

      {/* Project Selector */}
      <div className="px-3 pt-4 pb-2" ref={menuRef}>
        <button
          onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
            projectName
              ? 'bg-accent/10 hover:bg-accent/20 border border-accent/30'
              : 'bg-white/5 hover:bg-white/10 border border-white/10'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            projectName ? 'bg-accent/30' : 'bg-white/10'
          }`}>
            <FolderOpen className={`h-4 w-4 ${projectName ? 'text-accent' : 'text-muted'}`} />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {projectName || 'No Project'}
            </div>
            {projectName && servicesCount > 0 && (
              <div className="text-xs text-muted">
                {runningServicesCount}/{servicesCount} services running
              </div>
            )}
            {!projectName && (
              <div className="text-xs text-muted">Select a project</div>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-muted transition-transform ${
            isProjectMenuOpen ? 'rotate-180' : ''
          }`} />
        </button>

        {/* Dropdown Menu */}
        {isProjectMenuOpen && (
          <div className="absolute left-3 right-3 mt-1 py-2 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
            {/* Actions */}
            <div className="px-2 pb-2 border-b border-white/10">
              <button
                onClick={() => { onNewProject?.(); setIsProjectMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-md"
              >
                <Plus className="h-4 w-4 text-accent" />
                New Project
              </button>
              <button
                onClick={() => { onOpenProject?.(); setIsProjectMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-md"
              >
                <FolderOpen className="h-4 w-4 text-muted" />
                Open Project...
              </button>
            </div>

            {/* Recent Projects */}
            {recentProjects.length > 0 && (
              <div className="pt-2">
                <div className="px-3 py-1 text-xs text-muted font-medium">Recent Projects</div>
                {recentProjects.slice(0, 5).map((project) => (
                  <button
                    key={project.path}
                    onClick={() => {
                      onSelectProject?.(project.path);
                      setIsProjectMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10"
                  >
                    <FolderOpen className="h-4 w-4 text-muted" />
                    <span className="flex-1 text-left truncate">{project.name}</span>
                    {project.path === projectPath && (
                      <Check className="h-4 w-4 text-accent" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto" aria-label="Primary navigation">
        <div className="space-y-1">
          {mainNav.map((item) => {
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
        </div>

        {/* Tools Section */}
        <div className="mt-6">
          <div className="px-3 py-2 text-xs text-muted font-medium uppercase tracking-wider">
            Tools
          </div>
          <div className="space-y-1">
            {toolsNav.map((item) => {
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
                </Link>
              );
            })}
          </div>
        </div>
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
