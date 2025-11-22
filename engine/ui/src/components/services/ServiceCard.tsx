import { Service, ServiceStatus } from '../../types';
import { LoadingSpinner } from '../common/LoadingStates';
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

// Service icon mapping
const getServiceIcon = (serviceName: string, image: string): string => {
  const name = serviceName.toLowerCase();
  const img = image.toLowerCase();

  if (name.includes('postgres') || img.includes('postgres')) return '🐘';
  if (name.includes('redis') || img.includes('redis')) return '🔴';
  if (name.includes('mongo') || img.includes('mongo')) return '🍃';
  if (name.includes('mysql') || img.includes('mysql')) return '🐬';
  if (name.includes('nginx') || img.includes('nginx')) return '🌐';
  if (name.includes('node') || img.includes('node')) return '🟢';
  if (name.includes('python') || img.includes('python')) return '🐍';
  if (name.includes('docker') || img.includes('docker')) return '🐳';
  if (name.includes('rabbitmq') || img.includes('rabbitmq')) return '🐰';
  if (name.includes('kafka') || img.includes('kafka')) return '📨';
  if (name.includes('elasticsearch') || img.includes('elasticsearch')) return '🔍';
  return '📦';
};

export function ServiceCard({
  service,
  loading = false,
  onStart,
  onStop,
  onRestart,
  onViewLogs,
  onOpenShell,
}: ServiceCardProps) {
  const isRunning = service.status === ServiceStatus.Running;
  const isStopped = service.status === ServiceStatus.Stopped;
  const isError = service.status === ServiceStatus.Error;

  return (
    <article
      className="card hover-lift transition-smooth slide-in-up"
      aria-label={`Service ${service.name}, status: ${service.status}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Service Icon with hover effect */}
            <div className="text-5xl hover-scale transition-transform" aria-hidden="true">
              {getServiceIcon(service.name, service.image)}
            </div>

            {/* Service Info */}
            <div>
              <h3 className="text-lg font-bold text-white mb-1">{service.name}</h3>
              <p className="text-sm text-gray-400">{service.image}</p>
            </div>
          </div>

          {/* Status Badge with animated dot */}
          <span
            className={clsx(
              'px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-smooth',
              isRunning && 'bg-green-500/20 text-green-400 shadow-glow-success',
              isStopped && 'bg-gray-500/20 text-gray-400',
              isError && 'bg-red-500/20 text-red-400 shadow-glow-danger'
            )}
            role="status"
            aria-live="polite"
          >
            <span
              className={clsx(
                'status-dot',
                isRunning && 'status-dot-running',
                isStopped && 'status-dot-stopped',
                isError && 'status-dot-error'
              )}
            />
            {isRunning ? 'Running' : isStopped ? 'Stopped' : service.status}
          </span>
        </div>

        {/* Port Mapping */}
        {service.port && (
          <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm text-gray-400">
              Port: <span className="text-white font-mono">{service.port} → {service.port}</span>
            </p>
          </div>
        )}

        {/* Resource Usage (if available) */}
        {service.stats && (
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400 mb-1">CPU</p>
              <p className="text-sm font-semibold text-white">{service.stats.cpu.toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Memory</p>
              <p className="text-sm font-semibold text-white">{service.stats.memory.percentage.toFixed(1)}%</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label={`Actions for ${service.name}`}>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <LoadingSpinner size="sm" />
              <span className="text-sm">Processing...</span>
            </div>
          ) : (
            <>
              {isStopped && (
                <button
                  onClick={onStart}
                  disabled={loading}
                  className="px-4 py-2 rounded-md bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-smooth text-sm font-medium disabled:opacity-50 active-press focus-ring"
                  aria-label={`Start ${service.name} service`}
                >
                  Start
                </button>
              )}

              {isRunning && (
                <>
                  <button
                    onClick={onStop}
                    disabled={loading}
                    className="px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 text-white transition-smooth text-sm font-medium disabled:opacity-50 active-press focus-ring"
                    aria-label={`Stop ${service.name} service`}
                  >
                    Stop
                  </button>
                  <button
                    onClick={onRestart}
                    disabled={loading}
                    className="px-4 py-2 rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-smooth text-sm font-medium disabled:opacity-50 active-press focus-ring"
                    aria-label={`Restart ${service.name} service`}
                  >
                    Restart
                  </button>
                </>
              )}

              <button
                onClick={onViewLogs}
                disabled={loading}
                className="px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 text-white transition-smooth text-sm font-medium disabled:opacity-50 active-press focus-ring"
                aria-label={`View logs for ${service.name}`}
              >
                Logs
              </button>

              {isRunning && (
                <button
                  onClick={onOpenShell}
                  disabled={loading}
                  className="px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 text-white transition-smooth text-sm font-medium disabled:opacity-50 active-press focus-ring"
                  aria-label={`Open terminal for ${service.name}`}
                >
                  Terminal
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
