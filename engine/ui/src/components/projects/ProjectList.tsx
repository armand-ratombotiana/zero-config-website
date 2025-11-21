import { FolderOpen, Clock, Trash2, MoreVertical, Activity, Server, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export interface RecentProject {
  path: string;
  name: string;
  lastOpened: string;
  servicesCount?: number;
  status?: 'active' | 'inactive' | 'error';
}

interface ProjectListProps {
  onSelectProject: (path: string) => void;
  currentProjectPath?: string;
}

const STORAGE_KEY = 'zeroconfig_recent_projects';
const MAX_RECENT_PROJECTS = 10;

export function getRecentProjects(): RecentProject[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addRecentProject(project: Omit<RecentProject, 'lastOpened'>): void {
  const projects = getRecentProjects();
  const existing = projects.findIndex(p => p.path === project.path);

  const newProject: RecentProject = {
    ...project,
    lastOpened: new Date().toISOString(),
  };

  if (existing !== -1) {
    projects.splice(existing, 1);
  }

  projects.unshift(newProject);

  // Keep only the most recent projects
  const trimmed = projects.slice(0, MAX_RECENT_PROJECTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function removeRecentProject(path: string): void {
  const projects = getRecentProjects().filter(p => p.path !== path);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ProjectList({ onSelectProject, currentProjectPath }: ProjectListProps) {
  const [projects, setProjects] = useState<RecentProject[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    setProjects(getRecentProjects());
  }, []);

  const handleRemove = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecentProject(path);
    setProjects(getRecentProjects());
    setMenuOpen(null);
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <FolderOpen className="mx-auto h-12 w-12 text-muted mb-3" />
        <p className="text-sm text-muted">No recent projects</p>
        <p className="text-xs text-muted/70 mt-1">Open or create a project to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 mb-3">
        <h3 className="text-sm font-medium text-muted">Recent Projects</h3>
        <span className="text-xs text-muted/70">{projects.length} projects</span>
      </div>

      {projects.map((project) => {
        const isActive = project.path === currentProjectPath;

        return (
          <div
            key={project.path}
            onClick={() => onSelectProject(project.path)}
            className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
              isActive
                ? 'bg-accent/20 border border-accent/30'
                : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              isActive ? 'bg-accent/30' : 'bg-white/10'
            }`}>
              <FolderOpen className={`h-5 w-5 ${isActive ? 'text-accent' : 'text-muted'}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-white/90'}`}>
                  {project.name}
                </span>
                {isActive && (
                  <span className="badge badge-success text-xs">Active</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-muted truncate" title={project.path}>
                  {project.path.length > 35 ? '...' + project.path.slice(-32) : project.path}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-muted/70">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(project.lastOpened)}
                </span>
                {project.servicesCount !== undefined && (
                  <span className="flex items-center gap-1 text-xs text-muted/70">
                    <Server className="h-3 w-3" />
                    {project.servicesCount} services
                  </span>
                )}
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex-shrink-0">
              {project.status === 'active' && (
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              )}
              {project.status === 'error' && (
                <AlertCircle className="h-4 w-4 text-danger" />
              )}
            </div>

            {/* Menu button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(menuOpen === project.path ? null : project.path);
                }}
                className="p-1.5 rounded-md text-muted hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {menuOpen === project.path && (
                <div className="absolute right-0 top-full mt-1 w-36 py-1 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-10">
                  <button
                    onClick={(e) => handleRemove(project.path, e)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-white/5"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
