import { useState, useEffect, useRef } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, Pause, Play, Download, Clock, AlertTriangle, Server } from 'lucide-react';
import { StatsChart } from '../components/monitoring/StatsChart';
import { Service } from '../types';
import clsx from 'clsx';

interface MonitoringProps {
  services: Service[];
}

interface MetricSummary {
  current: number;
  average: number;
  peak: number;
  trend: 'up' | 'down' | 'stable';
}

type TimeRange = '1m' | '5m' | '15m' | '1h';

export function Monitoring({ services }: MonitoringProps) {
  const [cpuData, setCpuData] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');
  const [showAlerts, setShowAlerts] = useState(true);

  // Refs for interval management
  const intervalRef = useRef<number | null>(null);

  // Calculate aggregate metrics
  const calculateMetrics = (): { cpu: MetricSummary; memory: MetricSummary } => {
    const totalCpu = services.reduce((sum, s) => sum + (s.stats?.cpu || 0), 0);
    const totalMemory = services.reduce((sum, s) => sum + (s.stats?.memory.percentage || 0), 0);
    const avgCpu = services.length > 0 ? totalCpu / services.length : 0;
    const avgMemory = services.length > 0 ? totalMemory / services.length : 0;

    // Determine trend based on last few data points if available
    const lastCpu = cpuData.length > 1 ? cpuData[cpuData.length - 2].cpu : avgCpu;
    const cpuTrend = avgCpu > lastCpu ? 'up' : avgCpu < lastCpu ? 'down' : 'stable';

    return {
      cpu: {
        current: avgCpu,
        average: avgCpu, // In real app, calculate from history
        peak: Math.max(...cpuData.map(d => d.cpu), avgCpu),
        trend: cpuTrend,
      },
      memory: {
        current: avgMemory,
        average: avgMemory,
        peak: Math.max(...cpuData.map(d => d.memory), avgMemory),
        trend: 'stable',
      },
    };
  };

  const metrics = calculateMetrics();

  // Simulate real-time data updates
  useEffect(() => {
    if (isPaused) return;

    const updateData = () => {
      const timestamp = new Date().toLocaleTimeString();
      // Simulate realistic fluctuation around the current average
      const newDataPoint = {
        timestamp,
        cpu: Math.max(0, Math.min(100, metrics.cpu.current + (Math.random() - 0.5) * 10)),
        memory: Math.max(0, Math.min(100, metrics.memory.current + (Math.random() - 0.5) * 5)),
      };

      setCpuData((prev) => {
        const maxPoints = timeRange === '1m' ? 60 : timeRange === '5m' ? 300 : 60; // Simplified points
        const newArr = [...prev, newDataPoint];
        if (newArr.length > maxPoints) return newArr.slice(newArr.length - maxPoints);
        return newArr;
      });
    };

    intervalRef.current = setInterval(updateData, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, metrics.cpu.current, metrics.memory.current, timeRange]);

  const handleExport = () => {
    const dataStr = JSON.stringify(cpuData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-data-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-error" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-success" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">System Monitoring</h1>
          <p className="mt-1 text-sm text-gray-400">
            Real-time performance metrics and resource usage analysis
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-900/50 p-1.5 rounded-lg border border-white/5">
          <div className="flex items-center border-r border-white/10 pr-2 mr-2 gap-1">
            {(['1m', '5m', '15m', '1h'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  timeRange === range
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={handleExport}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title="Export Data"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alerts Banner */}
      {showAlerts && (metrics.cpu.current > 80 || metrics.memory.current > 80) && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-error">High Resource Usage Detected</h3>
            <p className="text-xs text-error/80 mt-1">
              {metrics.cpu.current > 80 && `CPU usage is high (${metrics.cpu.current.toFixed(1)}%). `}
              {metrics.memory.current > 80 && `Memory usage is high (${metrics.memory.current.toFixed(1)}%). `}
              Check running services for potential issues.
            </p>
          </div>
          <button
            onClick={() => setShowAlerts(false)}
            className="ml-auto text-error/60 hover:text-error"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-400">CPU Usage</p>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-white">{metrics.cpu.current.toFixed(1)}%</p>
              <div className="flex items-center mb-1.5">
                {getTrendIcon(metrics.cpu.trend)}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>Peak: {metrics.cpu.peak.toFixed(1)}%</span>
              <span>Avg: {metrics.cpu.average.toFixed(1)}%</span>
            </div>
            <div className="mt-3 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${metrics.cpu.current}%` }}
              />
            </div>
          </div>
        </div>

        <div className="card p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-400">Memory Usage</p>
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-white">{metrics.memory.current.toFixed(1)}%</p>
              <div className="flex items-center mb-1.5">
                {getTrendIcon(metrics.memory.trend)}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>Peak: {metrics.memory.peak.toFixed(1)}%</span>
              <span>Avg: {metrics.memory.average.toFixed(1)}%</span>
            </div>
            <div className="mt-3 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${metrics.memory.current}%` }}
              />
            </div>
          </div>
        </div>

        <div className="card p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-400">Active Services</p>
            <Server className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-white">{services.length}</p>
          <p className="mt-2 text-xs text-gray-500">Running containers</p>
        </div>

        <div className="card p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-400">System Status</p>
            <Activity className="h-4 w-4 text-success" />
          </div>
          <p className="text-3xl font-bold text-success">Healthy</p>
          <p className="mt-2 text-xs text-gray-500">All systems operational</p>
        </div>
      </div>

      {/* Main Chart */}
      <StatsChart
        data={cpuData}
        title="Resource Usage History"
        height={350}
        syncId="monitoring"
      />

      {/* Service Metrics Table */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Detailed Service Metrics</h2>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>Updated just now</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900/50 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-3">Service Name</th>
                <th className="px-6 py-3">CPU Usage</th>
                <th className="px-6 py-3">Memory Usage</th>
                <th className="px-6 py-3">Network I/O</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {services.map((service) => (
                <tr key={service.name} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center mr-3 text-lg">
                        {/* Placeholder for service icon */}
                        ⚡
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{service.name}</div>
                        <div className="text-xs text-gray-500">{service.image}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full max-w-xs">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300">{service.stats?.cpu.toFixed(1) || 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(service.stats?.cpu || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full max-w-xs">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300">{service.stats?.memory.percentage.toFixed(1) || 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(service.stats?.memory.percentage || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-success" />
                        {((service.stats?.network.rx || 0) / 1024).toFixed(1)} KB
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-blue-400" />
                        {((service.stats?.network.tx || 0) / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.healthStatus?.isHealthy
                        ? 'bg-success/10 text-success'
                        : 'bg-error/10 text-error'
                        }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${service.healthStatus?.isHealthy ? 'bg-success' : 'bg-error'
                        }`} />
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
