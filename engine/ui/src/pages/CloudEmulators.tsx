import { Play, Square, ExternalLink, Copy, Check, Info, Server, Database, Cloud, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface CloudProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'running' | 'stopped' | 'starting' | 'stopping';
  endpoint?: string;
  services?: string[];
  docsUrl?: string;
  envVars?: Record<string, string>;
  color: string;
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
    description: 'A fully functional local AWS cloud stack. Develop and test your cloud and serverless apps offline.',
    icon: Cloud,
    status: 'stopped',
    endpoint: 'http://localhost:4566',
    services: ['S3', 'DynamoDB', 'SQS', 'SNS', 'Lambda', 'API Gateway', 'CloudFormation', 'CloudWatch'],
    docsUrl: 'https://docs.localstack.cloud/',
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    envVars: {
      AWS_ACCESS_KEY_ID: 'test',
      AWS_SECRET_ACCESS_KEY: 'test',
      AWS_DEFAULT_REGION: 'us-east-1',
      AWS_ENDPOINT_URL: 'http://localhost:4566'
    }
  },
  {
    id: 'azure',
    name: 'Azurite (Azure)',
    description: 'An open source Azure Storage API compatible server (emulator).',
    icon: Globe,
    status: 'stopped',
    endpoint: 'http://localhost:10000',
    services: ['Blob Storage', 'Queue Storage', 'Table Storage'],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    envVars: {
      AZURE_STORAGE_CONNECTION_STRING: 'UseDevelopmentStorage=true'
    }
  },
  {
    id: 'gcp',
    name: 'GCP Emulators',
    description: 'Local emulators for Google Cloud Platform services.',
    icon: Server,
    status: 'stopped',
    endpoint: 'http://localhost:8080',
    services: ['Firestore', 'Pub/Sub', 'Bigtable', 'Spanner'],
    docsUrl: 'https://cloud.google.com/sdk/gcloud/reference/beta/emulators',
    color: 'text-red-500 bg-red-500/10 border-red-500/20',
    envVars: {
      FIRESTORE_EMULATOR_HOST: 'localhost:8080',
      PUBSUB_EMULATOR_HOST: 'localhost:8085'
    }
  },
];

export function CloudEmulators({ projectPath = '', onError, onSuccess }: CloudEmulatorsProps) {
  const [providers, setProviders] = useState<CloudProvider[]>(defaultProviders);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [copiedEnv, setCopiedEnv] = useState<string | null>(null);

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

  const handleCopyEnv = (providerId: string, envVars?: Record<string, string>) => {
    if (!envVars) return;

    const envString = Object.entries(envVars)
      .map(([key, value]) => `export ${key}=${value}`)
      .join('\n');

    navigator.clipboard.writeText(envString);
    setCopiedEnv(providerId);
    setTimeout(() => setCopiedEnv(null), 2000);
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {providers.map((provider) => {
          const Icon = provider.icon;
          return (
            <div key={provider.id} className="card p-6 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${provider.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{provider.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`relative flex h-2 w-2`}>
                        {provider.status === 'running' && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${provider.status === 'running' ? 'bg-success' :
                            provider.status === 'starting' ? 'bg-warning' : 'bg-gray-500'
                          }`}></span>
                      </span>
                      <span className="text-xs text-gray-400 capitalize">{provider.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-400 mb-6 flex-grow">
                {provider.description}
              </p>

              {provider.services && (
                <div className="mb-6">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Available Services</p>
                  <div className="flex flex-wrap gap-2">
                    {provider.services.map((service) => (
                      <span
                        key={service}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-gray-800 border border-gray-700 text-xs text-gray-300"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
                {provider.status === 'stopped' ? (
                  <button
                    onClick={() => handleStart(provider.id)}
                    disabled={isLoading(provider.id)}
                    className="btn-primary flex-1 justify-center"
                  >
                    {isLoading(provider.id) ? (
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Start Emulator
                  </button>
                ) : (
                  <button
                    onClick={() => handleStop(provider.id)}
                    disabled={isLoading(provider.id)}
                    className="btn-secondary flex-1 justify-center hover:bg-error/10 hover:text-error hover:border-error/20"
                  >
                    {isLoading(provider.id) ? (
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <Square className="h-4 w-4 mr-2" />
                    )}
                    Stop
                  </button>
                )}

                {provider.status === 'running' && provider.endpoint && (
                  <button
                    onClick={() => handleOpenUI(provider.endpoint)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    title="Open Dashboard"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                )}

                {provider.docsUrl && (
                  <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    title="Documentation"
                  >
                    <Info className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Info */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-accent" />
          Environment Configuration
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {providers.map((provider) => (
            <div key={provider.id} className="bg-gray-900/50 rounded-xl border border-white/5 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                <h3 className="text-sm font-medium text-gray-200">{provider.name} Variables</h3>
                <button
                  onClick={() => handleCopyEnv(provider.id, provider.envVars)}
                  className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-light transition-colors"
                >
                  {copiedEnv === provider.id ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-gray-400 leading-relaxed">
                  {provider.envVars && Object.entries(provider.envVars).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-purple-400">export</span> <span className="text-blue-400">{key}</span>=<span className="text-green-400">{value}</span>
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
