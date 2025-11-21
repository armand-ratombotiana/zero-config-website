import { Play, Square, RotateCw, Trash2, Terminal, FileText } from 'lucide-react';
import { Service, ServiceStatus } from '../../types';
import clsx from 'clsx';

interface ServiceCardProps {
  service: Service;
  loading?: boolean;
  onStart?: () => void;
  onStop?: () => void;
  onRestart?: () => void;
  onDelete?: () => void;
  onViewLogs?: () => void;
  onOpenShell?: () => void;
}

export function ServiceCard({
  service,
  loading = false,
  onStart,
  onStop,
  onRestart,
  onDelete,
  onViewLogs,
  onOpenShell,
}: ServiceCardProps) {
  const isRunning = service.status === ServiceStatus.Running;
  const isStarting = service.status === ServiceStatus.Starting;

  const statusColors = {
    [ServiceStatus.Running]: 'text-success-500 bg-success-500/10 border-success-500/20',
    [ServiceStatus.Stopped]: 'text-gray-400 bg-gray-800 border-gray-700',
    [ServiceStatus.Starting]: 'text-warning-500 bg-warning-500/10 border-warning-500/20',
    [ServiceStatus.Error]: 'text-error-500 bg-error-500/10 border-error-500/20',
    [ServiceStatus.Unknown]: 'text-gray-500 bg-gray-800 border-gray-700',
  };

  return (
    <article
      className="card p-6 hover:border-gray-700 transition-colors focus-within:ring-2 focus-within:ring-primary-500"
      aria-label={`Service ${service.name}, status: ${service.status}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-white">{service.name}</h3>
            <span
              className={clsx(
                'badge',
                statusColors[service.status]
              )}
              role="status"
              aria-live="polite"
            >
              {isStarting && (
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {service.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-400">{service.image}</p>
          {service.port && (
            <p className="mt-1 text-sm text-gray-500">
              Port: <span className="text-primary-400">localhost:{service.port}</span>
            </p>
          )}
        </div>

        {/* Health Status */}
        {service.healthStatus && (
          <div className="ml-4">
            <div
              className={clsx(
                'flex items-center space-x-2 rounded-full px-3 py-1 text-xs font-medium',
                service.healthStatus.isHealthy
                  ? 'bg-success-500/10 text-success-500'
                  : 'bg-error-500/10 text-error-500'
              )}
            >
              <div
                className={clsx(
                  'h-2 w-2 rounded-full',
                  service.healthStatus.isHealthy ? 'bg-success-500' : 'bg-error-500'
                )}
              ></div>
              <span>{service.healthStatus.statusMessage}</span>
              <span className="text-gray-500">({service.healthStatus.responseTimeMs}ms)</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      {service.stats && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-800/50 p-3">
            <p className="text-xs text-gray-400">CPU Usage</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {service.stats.cpu.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg bg-gray-800/50 p-3">
            <p className="text-xs text-gray-400">Memory</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {service.stats.memory.percentage.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {(service.stats.memory.used / 1024 / 1024).toFixed(0)} MB
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center space-x-2" role="group" aria-label={`Actions for ${service.name}`}>
        {!isRunning && !isStarting && (
          <button
            onClick={onStart}
            disabled={loading}
            aria-label={`Start ${service.name} service`}
            className="btn-success flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>Start</span>
          </button>
        )}
        {isRunning && (
          <>
            <button
              onClick={onStop}
              disabled={loading}
              className="btn-secondary flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span>Stop</span>
            </button>
            <button
              onClick={onRestart}
              disabled={loading}
              className="btn-secondary flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <RotateCw className="h-4 w-4" />
              )}
              <span>Restart</span>
            </button>
            <button onClick={onOpenShell} disabled={loading} className="btn-secondary flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <Terminal className="h-4 w-4" />
              <span>Shell</span>
            </button>
          </>
        )}
        <button onClick={onViewLogs} disabled={loading} className="btn-secondary flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          <FileText className="h-4 w-4" />
          <span>Logs</span>
        </button>
        {!isRunning && (
          <button onClick={onDelete} disabled={loading} className="btn-danger flex items-center space-x-2 text-sm ml-auto disabled:opacity-50 disabled:cursor-not-allowed">
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        )}
      </div>
    </article>
  );
}
