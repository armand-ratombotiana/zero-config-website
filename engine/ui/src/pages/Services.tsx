import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ServiceCard } from '../components/services/ServiceCard';
import { Service } from '../types';

interface ServicesProps {
  services: Service[];
  projectPath?: string;
  onRefresh?: () => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export function Services({ services, projectPath = '', onRefresh, onError, onSuccess }: ServicesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingServices, setLoadingServices] = useState<Set<string>>(new Set());

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.image.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleDelete = async (serviceName: string) => {
    if (!projectPath) {
      onError?.('No project path set');
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete service ${serviceName}?`);
    if (!confirmed) return;

    setServiceLoading(serviceName, true);
    try {
      await invoke('stop_service', {
        projectPath,
        serviceName
      });
      onSuccess?.(`Service ${serviceName} deleted successfully`);
      onRefresh?.();
    } catch (err) {
      onError?.(`Failed to delete ${serviceName}: ${err}`);
      console.error('Delete service error:', err);
    } finally {
      setServiceLoading(serviceName, false);
    }
  };

  const handleViewLogs = (serviceName: string) => {
    // Navigate to logs page with service filter
    window.location.href = `/logs?service=${serviceName}`;
  };

  const handleOpenShell = async (serviceName: string) => {
    if (!projectPath) {
      onError?.('No project path set');
      return;
    }

    try {
      const result = await invoke<string>('get_service_logs', {
        projectPath,
        serviceName,
        tail: 0,
      });
      console.log('Shell output:', result);
      onSuccess?.(`Opening shell for ${serviceName}...`);
    } catch (err) {
      onError?.(`Failed to open shell for ${serviceName}: ${err}`);
      console.error('Open shell error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Services</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage your containerized services
          </p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select className="input w-48">
            <option>All Statuses</option>
            <option>Running</option>
            <option>Stopped</option>
            <option>Error</option>
          </select>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredServices.map((service) => (
          <ServiceCard
            key={service.name}
            service={service}
            loading={loadingServices.has(service.name)}
            onStart={() => handleStart(service.name)}
            onStop={() => handleStop(service.name)}
            onRestart={() => handleRestart(service.name)}
            onDelete={() => handleDelete(service.name)}
            onViewLogs={() => handleViewLogs(service.name)}
            onOpenShell={() => handleOpenShell(service.name)}
          />
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="card p-12 text-center" role="status" aria-live="polite">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
            <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No services found</h3>
          <p className="text-gray-400 mb-4">
            {searchTerm
              ? `No services matching "${searchTerm}"`
              : 'Create a project with services to get started'}
          </p>
          {!searchTerm && (
            <button
              className="btn-primary inline-flex items-center space-x-2"
              aria-label="Add a new service to your project"
            >
              <Plus className="h-4 w-4" />
              <span>Add Service</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
