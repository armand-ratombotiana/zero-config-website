import { Play, Square, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface CloudProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping';
  endpoint?: string;
  services?: string[];
}

interface CloudEmulatorsProps {
  projectPath?: string;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

const defaultProviders: CloudProvider[] = [
  {
    id: 'aws',
    name: 'LocalStack (AWS)',
    description: 'AWS cloud services emulator',
    icon: '☁️',
    status: 'stopped',
    endpoint: 'http://localhost:4566',
    services: ['S3', 'DynamoDB', 'SQS', 'SNS', 'Lambda', 'API Gateway'],
  },
  {
    id: 'azure',
    name: 'Azurite (Azure)',
    description: 'Azure Storage emulator',
    icon: '🔷',
    status: 'stopped',
    endpoint: 'http://localhost:10000',
    services: ['Blob Storage', 'Queue Storage', 'Table Storage'],
  },
  {
    id: 'gcp',
    name: 'GCP Emulators',
    description: 'Google Cloud Platform emulators',
    icon: '🔴',
    status: 'stopped',
    endpoint: 'http://localhost:8080',
    services: ['Firestore', 'Pub/Sub', 'Bigtable'],
  },
];

export function CloudEmulators({ projectPath = '', onError, onSuccess }: CloudEmulatorsProps) {
  const [providers, setProviders] = useState<CloudProvider[]>(defaultProviders);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // Check cloud emulator status on mount
  useEffect(() => {
    checkAllStatus();
  }, [projectPath]);

  const checkAllStatus = async () => {
    if (!projectPath) return;

    for (const provider of providers) {
      try {
        const result = await invoke<string>('get_cloud_status', {
          projectPath,
          provider: provider.id
        });

        // Parse result to determine status
        const isRunning = result.toLowerCase().includes('running') ||
                          result.toLowerCase().includes('up') ||
                          result.toLowerCase().includes('healthy');

        setProviders(prev => prev.map(p =>
          p.id === provider.id
            ? { ...p, status: isRunning ? 'running' : 'stopped' }
            : p
        ));
      } catch {
        // If check fails, assume stopped
        setProviders(prev => prev.map(p =>
          p.id === provider.id ? { ...p, status: 'stopped' } : p
        ));
      }
    }
  };

  const handleStart = async (providerId: string) => {
    if (!projectPath) {
      onError?.('No project path configured');
      return;
    }

    setLoadingProvider(providerId);
    setProviders(prev => prev.map(p =>
      p.id === providerId ? { ...p, status: 'starting' } : p
    ));

    try {
      await invoke('start_cloud_emulator', { projectPath, provider: providerId });
      setProviders(prev => prev.map(p =>
        p.id === providerId ? { ...p, status: 'running' } : p
      ));
      onSuccess?.(`${providerId.toUpperCase()} emulator started successfully`);
    } catch (err) {
      setProviders(prev => prev.map(p =>
        p.id === providerId ? { ...p, status: 'stopped' } : p
      ));
      onError?.(`Failed to start ${providerId} emulator: ${err}`);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleStop = async (providerId: string) => {
    if (!projectPath) {
      onError?.('No project path configured');
      return;
    }

    setLoadingProvider(providerId);
    setProviders(prev => prev.map(p =>
      p.id === providerId ? { ...p, status: 'stopping' } : p
    ));

    try {
      await invoke('stop_cloud_emulator', { projectPath, provider: providerId });
      setProviders(prev => prev.map(p =>
        p.id === providerId ? { ...p, status: 'stopped' } : p
      ));
      onSuccess?.(`${providerId.toUpperCase()} emulator stopped successfully`);
    } catch (err) {
      setProviders(prev => prev.map(p =>
        p.id === providerId ? { ...p, status: 'running' } : p
      ));
      onError?.(`Failed to stop ${providerId} emulator: ${err}`);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleOpenUI = (endpoint?: string) => {
    if (endpoint) {
      window.open(endpoint, '_blank');
    }
  };

  const isLoading = (providerId: string) => loadingProvider === providerId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cloud Emulators</h1>
        <p className="mt-1 text-sm text-gray-400">
          Run cloud services locally for development and testing
        </p>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {providers.map((provider) => (
          <div key={provider.id} className="card p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800 text-2xl">
                  {provider.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{provider.name}</h3>
                  <p className="text-sm text-gray-400">{provider.description}</p>
                </div>
              </div>
              <span
                className={`badge ${
                  provider.status === 'running' ? 'badge-success' : 'text-gray-400 bg-gray-800'
                }`}
              >
                {provider.status}
              </span>
            </div>

            {provider.endpoint && (
              <div className="mt-4">
                <p className="text-sm text-gray-400">Endpoint</p>
                <p className="mt-1 text-sm font-mono text-primary-400">{provider.endpoint}</p>
              </div>
            )}

            {provider.services && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Available Services</p>
                <div className="flex flex-wrap gap-2">
                  {provider.services.map((service) => (
                    <span
                      key={service}
                      className="inline-flex items-center rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-300"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center space-x-2" role="group" aria-label={`Actions for ${provider.name}`}>
              {provider.status === 'stopped' ? (
                <button
                  onClick={() => handleStart(provider.id)}
                  disabled={isLoading(provider.id)}
                  aria-label={`Start ${provider.name}`}
                  className="btn-success flex items-center space-x-2 text-sm flex-1 disabled:opacity-50"
                >
                  {isLoading(provider.id) ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span>Start</span>
                </button>
              ) : provider.status === 'running' ? (
                <>
                  <button
                    onClick={() => handleStop(provider.id)}
                    disabled={isLoading(provider.id)}
                    aria-label={`Stop ${provider.name}`}
                    className="btn-secondary flex items-center space-x-2 text-sm flex-1 disabled:opacity-50"
                  >
                    {isLoading(provider.id) ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    <span>Stop</span>
                  </button>
                  <button
                    onClick={() => handleOpenUI(provider.endpoint)}
                    aria-label={`Open ${provider.name} UI`}
                    className="btn-secondary flex items-center space-x-2 text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  disabled
                  className="btn-secondary flex items-center space-x-2 text-sm flex-1 opacity-50"
                >
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>{provider.status === 'starting' ? 'Starting...' : 'Stopping...'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Configuration Info */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Configuration</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">AWS (LocalStack)</h3>
            <pre className="rounded-lg bg-gray-800 p-4 text-sm text-gray-300 overflow-x-auto">
              <code>{`export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566`}</code>
            </pre>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Azure (Azurite)</h3>
            <pre className="rounded-lg bg-gray-800 p-4 text-sm text-gray-300 overflow-x-auto">
              <code>{`DefaultEndpointsProtocol=http;
AccountName=devstoreaccount1;
AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;
BlobEndpoint=http://localhost:10000/devstoreaccount1;`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
