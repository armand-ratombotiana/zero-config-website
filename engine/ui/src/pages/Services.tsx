import { RefreshCw, Play, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ServiceCard } from '../components/services/ServiceCard';
import { Service } from '../types';
import clsx from 'clsx';

interface ServicesProps {
  services: Service[];
  projectPath?: string;
  onRefresh?: () => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export function Services({ services, projectPath = '', onRefresh, onError, onSuccess }: ServicesProps) {
  const [loadingServices, setLoadingServices] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all');

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      // Filter by search query
      const matchesSearch =
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.image.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Filter by status
      if (statusFilter === 'all') return true;
      if (statusFilter === 'running') return service.status === 'running';
      if (statusFilter === 'stopped') return service.status === 'stopped';

      return true;
    });
  }, [services, searchQuery, statusFilter]);

  const setServiceLoading = (serviceName: string, loading: boolean) => {
    setLoadingServices(prev => {
      const next = new Set(prev);
      if (loading) {
        next.add(serviceName);
      } else {
        next.delete(serviceName);
      }
      return next;
    });
  };

  // ... (handlers: handleStartAll, handleStart, handleStop, handleRestart, handleViewLogs)

  const handleStartAll = async () => {
    if (!projectPath) {
      onError?.('No project path set');
      return;
    }

    try {
      await invoke('start_services', { projectPath });
      onSuccess?.('All services started successfully');
      onRefresh?.();
    } catch (err) {
      onError?.(`Failed to start services: ${err}`);
      console.error('Start all services error:', err);
    }
  };

  const handleStart = async (serviceName: string) => {
    if (!projectPath) {
      onError?.('No project path set');
      return;
    }

    setServiceLoading(serviceName, true);
    try {
      await invoke('start_service', {
        projectPath,
        serviceName
      });
      onSuccess?.(`Service ${serviceName} started successfully`);
      onRefresh?.();
    } catch (err) {
      onError?.(`Failed to start ${serviceName}: ${err}`);
      console.error('Start service error:', err);
    } finally {
      setServiceLoading(serviceName, false);
    }
  };

  const handleStop = async (serviceName: string) => {
    if (!projectPath) {
      onError?.('No project path set');
      return;
    }

    setServiceLoading(serviceName, true);
    try {
      await invoke('stop_service', {
        projectPath,
        serviceName
      });
      onSuccess?.(`Service ${serviceName} stopped successfully`);
      onRefresh?.();
    } catch (err) {
      onError?.(`Failed to stop ${serviceName}: ${err}`);
      console.error('Stop service error:', err);
    } finally {
      setServiceLoading(serviceName, false);
    }
  };

  const handleRestart = async (serviceName: string) => {
    if (!projectPath) {
      onError?.('No project path set');
      return;
    }

    setServiceLoading(serviceName, true);
    try {
      await invoke('restart_service', {
        projectPath,
        serviceName
      });
      onSuccess?.(`Service ${serviceName} restarted successfully`);
      onRefresh?.();
    } catch (err) {
      onError?.(`Failed to restart ${serviceName}: ${err}`);
      console.error('Restart service error:', err);
    } finally {
      setServiceLoading(serviceName, false);
    }
  };

  const handleViewLogs = (serviceName: string) => {
    // Navigate to logs page with service filter
    window.location.href = `/logs?service=${serviceName}`;
  };

  const handleOpenShell = async (serviceName: string) => {
    if (!projectPath) return;
    try {
      await invoke('open_terminal_window', {
        projectPath,
        serviceName,
        shell: 'sh'
      });
    } catch (err) {
      onError?.(`Failed to open terminal: ${err}`);
      console.error('Open shell error:', err);
    }
  };

  const runningCount = services.filter(s => s.status === 'running').length;
  const stoppedCount = services.filter(s => s.status === 'stopped').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Services</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartAll}
              className="px-4 py-2 rounded-md bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start All
            </button>
            <button
              onClick={onRefresh}
              className="px-4 py-2 rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Filter Toolbar */}
        <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-white/5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Filter services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-md py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-md border border-white/10">
            <button
              onClick={() => setStatusFilter('all')}
              className={clsx(
                "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                statusFilter === 'all' ? "bg-blue-500/20 text-blue-400" : "text-gray-400 hover:text-white"
              )}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('running')}
              className={clsx(
                "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                statusFilter === 'running' ? "bg-green-500/20 text-green-400" : "text-gray-400 hover:text-white"
              )}
            >
              Running
            </button>
            <button
              onClick={() => setStatusFilter('stopped')}
              className={clsx(
                "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                statusFilter === 'stopped' ? "bg-red-500/20 text-red-400" : "text-gray-400 hover:text-white"
              )}
            >
              Stopped
            </button>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {filteredServices.map((service) => (
          <ServiceCard
            key={service.name}
            service={service}
            loading={loadingServices.has(service.name)}
            onStart={() => handleStart(service.name)}
            onStop={() => handleStop(service.name)}
            onRestart={() => handleRestart(service.name)}
            onViewLogs={() => handleViewLogs(service.name)}
            onOpenShell={() => handleOpenShell(service.name)}
          />
        ))}
      </div>

      {/* Status Bar */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between text-sm text-gray-400">
        <div>{services.length} services • {runningCount} running • {stoppedCount} stopped</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          Docker running
        </div>
      </div>

      {services.length === 0 && (
        <div className="card p-12 text-center" role="status" aria-live="polite">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
            <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No services found</h3>
          <p className="text-gray-400 mb-4">
            Create a project with services to get started
          </p>
        </div>
      )}
    </div>
  );
}
