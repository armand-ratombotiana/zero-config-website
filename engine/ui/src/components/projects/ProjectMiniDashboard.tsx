import { Activity, Server, Cloud, AlertCircle, Play, Square, ExternalLink } from 'lucide-react';
import { Service, ServiceStatus } from '../../types';

interface ProjectMiniDashboardProps {
  projectName: string;
  projectPath: string;
  services: Service[];
  cloudEmulators?: number;
  onStartAll?: () => void;
  onStopAll?: () => void;
  onViewDetails?: () => void;
  isLoading?: boolean;
}

export function ProjectMiniDashboard({
  projectName,
  projectPath,
  services,
  cloudEmulators = 0,
  onStartAll,
  onStopAll,
  onViewDetails,
  isLoading = false,
}: ProjectMiniDashboardProps) {
  const runningServices = services.filter(s => s.status === ServiceStatus.Running).length;
  const totalServices = services.length;
  const errorServices = services.filter(s => s.status === ServiceStatus.Error).length;
  const hasRunningServices = runningServices > 0;

  return (
    <div className="glass-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            errorServices > 0 ? 'bg-danger' :
            hasRunningServices ? 'bg-success animate-pulse' :
            'bg-gray-500'
          }`} />
          <div>
            <h3 className="text-sm font-semibold text-white">{projectName}</h3>
            <p className="text-xs text-muted truncate max-w-[200px]" title={projectPath}>
              {projectPath}
            </p>
          </div>
        </div>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="p-1.5 rounded-md text-muted hover:text-white hover:bg-white/10 transition-colors"
            title="View project details"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 rounded-lg bg-white/5">
          <div className="flex items-center justify-center gap-1 text-success mb-1">
            <Server className="h-3.5 w-3.5" />
          </div>
          <div className="text-lg font-semibold text-white">
            {runningServices}/{totalServices}
          </div>
          <div className="text-xs text-muted">Services</div>
        </div>

        <div className="text-center p-2 rounded-lg bg-white/5">
          <div className="flex items-center justify-center gap-1 text-accent-purple mb-1">
            <Cloud className="h-3.5 w-3.5" />
          </div>
          <div className="text-lg font-semibold text-white">
            {cloudEmulators}
          </div>
          <div className="text-xs text-muted">Cloud</div>
        </div>

        <div className="text-center p-2 rounded-lg bg-white/5">
          <div className={`flex items-center justify-center gap-1 mb-1 ${
            errorServices > 0 ? 'text-danger' : 'text-muted'
          }`}>
            <AlertCircle className="h-3.5 w-3.5" />
          </div>
          <div className={`text-lg font-semibold ${errorServices > 0 ? 'text-danger' : 'text-white'}`}>
            {errorServices}
          </div>
          <div className="text-xs text-muted">Errors</div>
        </div>
      </div>

      {/* Service Pills */}
      {services.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {services.slice(0, 5).map((service) => (
            <span
              key={service.name}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                service.status === ServiceStatus.Running
                  ? 'bg-success/20 text-success'
                  : service.status === ServiceStatus.Error
                  ? 'bg-danger/20 text-danger'
                  : 'bg-white/10 text-muted'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                service.status === ServiceStatus.Running ? 'bg-success' :
                service.status === ServiceStatus.Error ? 'bg-danger' :
                'bg-gray-500'
              }`} />
              {service.name}
            </span>
          ))}
          {services.length > 5 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-white/10 text-muted">
              +{services.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 pt-2 border-t border-white/10">
        <button
          onClick={onStartAll}
          disabled={isLoading || !totalServices}
          className="flex-1 btn btn-sm btn-primary flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" />
          <span>Start All</span>
        </button>
        <button
          onClick={onStopAll}
          disabled={isLoading || !hasRunningServices}
          className="flex-1 btn btn-sm btn-secondary flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Square className="h-3.5 w-3.5" />
          <span>Stop All</span>
        </button>
      </div>
    </div>
  );
}
