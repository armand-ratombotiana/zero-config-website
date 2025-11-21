import { Bell, RefreshCw, FolderOpen, Plus } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  projectPath?: string;
  onRefresh?: () => void;
  onOpenProject?: () => void;
  onNewProject?: () => void;
}

export function Header({ projectPath, onRefresh, onOpenProject, onNewProject }: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-surface/80 backdrop-blur-lg px-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-white">
          {projectPath ? (
            <span className="flex items-center">
              <FolderOpen className="mr-2 h-5 w-5 text-accent" />
              {projectPath.split(/[\\/]/).pop()}
            </span>
          ) : (
            'No Project Loaded'
          )}
        </h2>
        {projectPath && (
          <span className="text-sm text-muted truncate max-w-md">
            {projectPath}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={onNewProject}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>

        <button
          onClick={onOpenProject}
          className="btn btn-ghost flex items-center space-x-2"
        >
          <FolderOpen className="h-4 w-4" />
          <span>Open Project</span>
        </button>

        <button
          onClick={handleRefresh}
          className="btn btn-ghost flex items-center space-x-2"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>

        <button className="relative rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger"></span>
        </button>
      </div>
    </header>
  );
}
