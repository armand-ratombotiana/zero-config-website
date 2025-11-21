import { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { StatsChart } from '../components/monitoring/StatsChart';
import { Service } from '../types';

interface MonitoringProps {
  services: Service[];
}

interface MetricSummary {
  current: number;
  average: number;
  trend: 'up' | 'down' | 'stable';
}

export function Monitoring({ services }: MonitoringProps) {
  const [cpuData, setCpuData] = useState<any[]>([]);
  const [memoryData, setMemoryData] = useState<any[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(2000);

  // Calculate aggregate metrics
  const calculateMetrics = (): { cpu: MetricSummary; memory: MetricSummary } => {
    const totalCpu = services.reduce((sum, s) => sum + (s.stats?.cpu || 0), 0);
    const totalMemory = services.reduce((sum, s) => sum + (s.stats?.memory.percentage || 0), 0);
    const avgCpu = services.length > 0 ? totalCpu / services.length : 0;
    const avgMemory = services.length > 0 ? totalMemory / services.length : 0;

    return {
      cpu: {
        current: avgCpu,
        average: avgCpu,
        trend: 'stable',
      },
      memory: {
        current: avgMemory,
        average: avgMemory,
        trend: 'stable',
      },
    };
  };

  const metrics = calculateMetrics();

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const timestamp = new Date().toLocaleTimeString();
      const newDataPoint = {
        timestamp,
        cpu: metrics.cpu.current + (Math.random() - 0.5) * 5,
        memory: metrics.memory.current + (Math.random() - 0.5) * 3,
      };

      setCpuData((prev) => [...prev.slice(-19), newDataPoint]);
      setMemoryData((prev) => [...prev.slice(-19), newDataPoint]);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, metrics]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-error-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-success-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitoring</h1>
          <p className="mt-1 text-sm text-gray-400">
            Real-time performance metrics and resource usage
          </p>
        </div>
        <select
          value={refreshInterval}
          onChange={(e) => setRefreshInterval(Number(e.target.value))}
          className="input w-48"
        >
          <option value={1000}>Refresh: 1s</option>
          <option value={2000}>Refresh: 2s</option>
          <option value={5000}>Refresh: 5s</option>
          <option value={10000}>Refresh: 10s</option>
        </select>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg CPU Usage</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {metrics.cpu.current.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg bg-primary-500/10 p-3">
              <Activity className="h-8 w-8 text-primary-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            {getTrendIcon(metrics.cpu.trend)}
            <span className="text-sm text-gray-400">
              Avg: {metrics.cpu.average.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Memory Usage</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {metrics.memory.current.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg bg-success-500/10 p-3">
              <Activity className="h-8 w-8 text-success-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            {getTrendIcon(metrics.memory.trend)}
            <span className="text-sm text-gray-400">
              Avg: {metrics.memory.average.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Services</p>
              <p className="mt-2 text-3xl font-semibold text-white">{services.length}</p>
            </div>
            <div className="rounded-lg bg-primary-400/10 p-3">
              <Activity className="h-8 w-8 text-primary-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-400">Running containers</span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Health Status</p>
              <p className="mt-2 text-3xl font-semibold text-success-500">Good</p>
            </div>
            <div className="rounded-lg bg-success-500/10 p-3">
              <Activity className="h-8 w-8 text-success-500" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-400">All systems operational</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StatsChart data={cpuData} title="CPU Usage Over Time" />
        <StatsChart data={memoryData} title="Memory Usage Over Time" />
      </div>

      {/* Service-specific metrics */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Service Metrics</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left text-sm text-gray-400">
                <th className="pb-3">Service</th>
                <th className="pb-3">CPU %</th>
                <th className="pb-3">Memory</th>
                <th className="pb-3">Network RX/TX</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-300">
              {services.map((service) => (
                <tr key={service.name} className="border-b border-gray-800/50">
                  <td className="py-4 font-medium text-white">{service.name}</td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full"
                          style={{ width: `${service.stats?.cpu || 0}%` }}
                        ></div>
                      </div>
                      <span>{service.stats?.cpu.toFixed(1) || 0}%</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-success-500 h-2 rounded-full"
                          style={{ width: `${service.stats?.memory.percentage || 0}%` }}
                        ></div>
                      </div>
                      <span>{service.stats?.memory.percentage.toFixed(1) || 0}%</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-gray-400">
                      {((service.stats?.network.rx || 0) / 1024).toFixed(1)}KB /{' '}
                      {((service.stats?.network.tx || 0) / 1024).toFixed(1)}KB
                    </span>
                  </td>
                  <td className="py-4">
                    <span
                      className={`badge ${
                        service.healthStatus?.isHealthy ? 'badge-success' : 'badge-error'
                      }`}
                    >
                      {service.healthStatus?.isHealthy ? 'Healthy' : 'Unhealthy'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
