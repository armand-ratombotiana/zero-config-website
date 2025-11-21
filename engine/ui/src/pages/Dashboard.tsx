import { Server, Cloud, Activity, AlertCircle, Play, Square, RotateCw, CheckCircle, XCircle, Box, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Service, ServiceStatus } from '../types';

interface ContainerRuntime {
  name: string;
  installed: boolean;
  running: boolean;
  version?: string;
  is_preferred: boolean;
}

interface DashboardProps {
  services: Service[];
  cloudEmulators?: number;
  projectPath?: string;
  onRefresh?: () => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export function Dashboard({
  services,
  cloudEmulators = 0,
  projectPath = '',
  onRefresh,
  onError,
  onSuccess
}: DashboardProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [runtimes, setRuntimes] = useState<ContainerRuntime[]>([]);
  const [isCheckingRuntimes, setIsCheckingRuntimes] = useState(true);

  // Check container runtime status on mount
  const checkContainerRuntimes = useCallback(async () => {
    setIsCheckingRuntimes(true);
    try {
      const detected = await invoke<ContainerRuntime[]>('detect_all_runtimes');
      setRuntimes(detected);
    } catch (err) {
      console.error('Failed to detect runtimes:', err);
      // Fallback to legacy detection
      try {
        const dockerVersion = await invoke<string>('check_docker_status');
        setRuntimes([{
          name: 'Docker',
          installed: true,
          running: true,
          version: dockerVersion,
          is_preferred: true,
        }]);
      } catch {
        try {
          const podmanVersion = await invoke<string>('check_podman_status');
          setRuntimes([{
            name: 'Podman',
            installed: true,
            running: true,
            version: podmanVersion,
            is_preferred: true,
          }]);
        } catch {
          setRuntimes([]);
        }
      }
    } finally {
      setIsCheckingRuntimes(false);
    }
  }, []);

  useEffect(() => {
    checkContainerRuntimes();
  }, [checkContainerRuntimes]);

  const handleStartAll = async () => {
    if (!projectPath) {
      onError?.('No project path configured');
      return;
    }
    setActionLoading('start');
    try {
      await invoke('start_services', { projectPath });
      onSuccess?.('All services started successfully');
      onRefresh?.();
    } catch (err) {
      onError?.(`Failed to start services: ${err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopAll = async () => {
    if (!projectPath) {
      onError?.('No project path configured');
      return;
    }
    setActionLoading('stop');
    try {
      await invoke('stop_services', { projectPath });
      onSuccess?.('All services stopped successfully');
      onRefresh?.();
    } catch (err) {
      onError?.(`Failed to stop services: ${err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestartAll = async () => {
    if (!projectPath) {
      onError?.('No project path configured');
      return;
    }
    setActionLoading('restart');
    try {
      await invoke('stop_services', { projectPath });
      await invoke('start_services', { projectPath });
      onSuccess?.('All services restarted successfully');
      onRefresh?.();
    } catch (err) {
      onError?.(`Failed to restart services: ${err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const runningServices = services.filter(s => s.status === ServiceStatus.Running).length;
  const totalServices = services.length;
  const healthyServices = services.filter(s => s.healthStatus?.isHealthy).length;
  const errorServices = services.filter(s => s.status === ServiceStatus.Error).length;

  // Get preferred/active runtime
  const preferredRuntime = runtimes.find(r => r.is_preferred);
  const runningRuntimes = runtimes.filter(r => r.running);
  const installedRuntimes = runtimes.filter(r => r.installed);
  const hasRunningRuntime = runningRuntimes.length > 0;

  const stats = [
    {
      name: 'Total Services',
      value: totalServices,
      icon: Server,
      color: 'text-accent bg-accent/10',
    },
    {
      name: 'Running Services',
      value: runningServices,
      icon: Activity,
      color: 'text-success bg-success/10',
    },
    {
      name: 'Cloud Emulators',
      value: cloudEmulators,
      icon: Cloud,
      color: 'text-accent-purple bg-accent-purple/10',
    },
    {
      name: 'Errors',
      value: errorServices,
      icon: AlertCircle,
      color: 'text-error bg-error/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">
          Monitor and manage your development environment
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card p-6">
              <div className="flex items-center">
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Services */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Services Overview</h2>
        <div className="space-y-3">
          {services.length === 0 ? (
            <div className="text-center py-12">
              <Server className="mx-auto h-12 w-12 text-gray-600" />
              <h3 className="mt-2 text-sm font-medium text-gray-400">No services found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by loading a project with a zero.yml configuration
              </p>
            </div>
          ) : (
            services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between rounded-lg bg-gray-800/50 p-4 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      service.status === ServiceStatus.Running
                        ? 'bg-success'
                        : service.status === ServiceStatus.Error
                        ? 'bg-error'
                        : 'bg-gray-500'
                    }`}
                  ></div>
                  <div>
                    <p className="text-sm font-medium text-white">{service.name}</p>
                    <p className="text-xs text-gray-400">{service.image}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {service.port && (
                    <span className="text-sm text-gray-400">:{service.port}</span>
                  )}
                  {service.stats && (
                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                      <span>CPU: {service.stats.cpu.toFixed(1)}%</span>
                      <span>Mem: {service.stats.memory.percentage.toFixed(1)}%</span>
                    </div>
                  )}
                  <span
                    className={`badge ${
                      service.status === ServiceStatus.Running
                        ? 'badge-success'
                        : service.status === ServiceStatus.Error
                        ? 'badge-error'
                        : 'text-gray-400 bg-gray-800'
                    }`}
                  >
                    {service.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions and System Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button
              onClick={handleStartAll}
              disabled={actionLoading !== null || !hasRunningRuntime}
              className="btn-primary w-full justify-center flex items-center space-x-2 disabled:opacity-50"
              aria-label="Start all services"
            >
              {actionLoading === 'start' ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>Start All Services</span>
            </button>
            <button
              onClick={handleStopAll}
              disabled={actionLoading !== null || !hasRunningRuntime}
              className="btn-secondary w-full justify-center flex items-center space-x-2 disabled:opacity-50"
              aria-label="Stop all services"
            >
              {actionLoading === 'stop' ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span>Stop All Services</span>
            </button>
            <button
              onClick={handleRestartAll}
              disabled={actionLoading !== null || !hasRunningRuntime}
              className="btn-secondary w-full justify-center flex items-center space-x-2 disabled:opacity-50"
              aria-label="Restart all services"
            >
              {actionLoading === 'restart' ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <RotateCw className="h-4 w-4" />
              )}
              <span>Restart All Services</span>
            </button>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Container Runtimes</h2>
            <button
              onClick={checkContainerRuntimes}
              disabled={isCheckingRuntimes}
              className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Refresh runtime status"
            >
              <RefreshCw className={`h-4 w-4 ${isCheckingRuntimes ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isCheckingRuntimes ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="ml-2 text-gray-400">Detecting runtimes...</span>
            </div>
          ) : runtimes.length === 0 ? (
            <div className="text-center py-8">
              <XCircle className="mx-auto h-10 w-10 text-error" />
              <p className="mt-2 text-sm text-gray-400">No container runtimes detected</p>
              <p className="text-xs text-gray-500 mt-1">Install Docker, Podman, or another container runtime</p>
            </div>
          ) : (
            <div className="space-y-2">
              {runtimes.filter(r => r.installed).map((runtime) => (
                <div
                  key={runtime.name}
                  className={`flex items-center justify-between rounded-lg p-3 ${
                    runtime.is_preferred ? 'bg-accent/10 border border-accent/30' : 'bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Box className={`h-5 w-5 ${runtime.running ? 'text-success' : 'text-gray-500'}`} />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-white">{runtime.name}</span>
                        {runtime.is_preferred && (
                          <span className="badge badge-info text-xs">Active</span>
                        )}
                      </div>
                      {runtime.version && (
                        <span className="text-xs text-gray-400">v{runtime.version}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {runtime.running ? (
                      <span className="badge badge-success flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Running</span>
                      </span>
                    ) : (
                      <span className="badge text-warning bg-warning/10 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Stopped</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Summary row */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10">
                <span className="text-sm text-gray-400">
                  {runningRuntimes.length} of {installedRuntimes.length} runtimes available
                </span>
                {preferredRuntime && (
                  <span className="text-sm text-accent">
                    Using: {preferredRuntime.name}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Health Summary */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">System Health</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
            <span className="text-sm text-gray-400">Healthy Services</span>
            <span className="text-sm text-white">
              {healthyServices} / {totalServices}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
            <span className="text-sm text-gray-400">Container Runtime</span>
            <span className={hasRunningRuntime ? 'badge badge-success' : 'badge badge-error'}>
              {hasRunningRuntime ? preferredRuntime?.name || 'Available' : 'Not Available'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
            <span className="text-sm text-gray-400">Overall Status</span>
            <span className={errorServices > 0 || !hasRunningRuntime ? 'badge badge-error' : 'badge badge-success'}>
              {errorServices > 0 ? 'Issues Detected' : !hasRunningRuntime ? 'Runtime Missing' : 'All Systems Operational'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
