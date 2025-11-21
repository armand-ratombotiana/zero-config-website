import { Bell, RefreshCw, FolderOpen, Plus, X, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  projectPath?: string;
  projectName?: string;
  onRefresh?: () => void;
  onOpenProject?: () => void;
  onNewProject?: () => void;
  onCloseProject?: () => void;
  isLoading?: boolean;
}

export function Header({
  projectPath,
  projectName,
  onRefresh,
  onOpenProject,
  onNewProject,
  onCloseProject,
  isLoading = false,
}: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 glass px-6">
      <div className="flex items-center space-x-4">
        {projectPath ? (
          <>
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
                <FolderOpen className="h-4 w-4 text-accent" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">
                  {projectName || projectPath.split(/[\\/]/).pop()}
                </h2>
                <p className="text-xs text-muted truncate max-w-xs" title={projectPath}>
                  {projectPath}
                </p>
              </div>
            </div>
            {onCloseProject && (
              <button
                onClick={onCloseProject}
                className="p-1.5 rounded-md text-muted hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close project"
                title="Close project"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <h2 className="text-lg font-semibold text-muted">No Project Loaded</h2>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onNewProject}
          className="btn btn-primary flex items-center space-x-2"
          aria-label="Create new project"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">New Project</span>
        </button>

        <button
          onClick={onOpenProject}
          className="btn btn-secondary flex items-center space-x-2"
          aria-label="Open existing project"
        >
          <FolderOpen className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Open</span>
        </button>

        {projectPath && (
          <button
            onClick={handleRefresh}
            className="btn btn-ghost flex items-center space-x-2"
            disabled={isRefreshing || isLoading}
            aria-label="Refresh services"
          >
            {isRefreshing || isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}

        <button
          className="relative rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" aria-hidden="true"></span>
        </button>
      </div>
    </header>
  );
}
