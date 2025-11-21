import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Download, Trash2, Play, Pause } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { Service } from '../types';

interface LogsProps {
  services: Service[];
  projectPath?: string;
}

interface LogEntry {
  timestamp: string;
  service: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export function Logs({ services, projectPath = '' }: LogsProps) {
  const [selectedService, setSelectedService] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [logLevel, setLogLevel] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Parse log line into structured format
  const parseLogLine = (line: string, serviceName: string): LogEntry | null => {
    if (!line.trim()) return null;

    // Try to detect log level from content
    let level: 'info' | 'warn' | 'error' | 'debug' = 'info';
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('error') || lowerLine.includes('fatal') || lowerLine.includes('exception')) {
      level = 'error';
    } else if (lowerLine.includes('warn') || lowerLine.includes('warning')) {
      level = 'warn';
    } else if (lowerLine.includes('debug') || lowerLine.includes('trace')) {
      level = 'debug';
    }

    // Try to extract timestamp from log line
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})/);
    const timestamp = timestampMatch ? timestampMatch[1].replace('T', ' ') : new Date().toISOString().replace('T', ' ').slice(0, 19);

    return {
      timestamp,
      service: serviceName,
      level,
      message: line.trim(),
    };
  };

  // Fetch logs for a service
  const fetchServiceLogs = useCallback(async (serviceName: string) => {
    if (!projectPath) return [];

    try {
      const result = await invoke<string>('get_service_logs', {
        projectPath,
        serviceName,
        tail: 100,
      });

      const lines = result.split('\n').filter(line => line.trim());
      return lines
        .map(line => parseLogLine(line, serviceName))
        .filter((entry): entry is LogEntry => entry !== null);
    } catch {
      return [];
    }
  }, [projectPath]);

  // Fetch all logs
  const fetchAllLogs = useCallback(async () => {
    if (!projectPath || services.length === 0) return;

    try {
      const servicesToFetch = selectedService === 'all'
        ? services.map(s => s.name)
        : [selectedService];

      const allLogs: LogEntry[] = [];
      for (const serviceName of servicesToFetch) {
        const serviceLogs = await fetchServiceLogs(serviceName);
        allLogs.push(...serviceLogs);
      }

      // Sort by timestamp
      allLogs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      setLogs(allLogs);
    } catch {
      // Silently ignore errors during polling
    }
  }, [projectPath, services, selectedService, fetchServiceLogs]);

  // Initial load and polling
  useEffect(() => {
    fetchAllLogs();

    // Set up polling when autoScroll is enabled
    if (autoScroll && projectPath) {
      intervalRef.current = setInterval(fetchAllLogs, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAllLogs, autoScroll, projectPath]);

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    const matchesService = selectedService === 'all' || log.service === selectedService;
    const matchesLevel = logLevel === 'all' || log.level === logLevel;
    const matchesSearch =
      searchTerm === '' ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.service.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesService && matchesLevel && matchesSearch;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-error-500';
      case 'warn':
        return 'text-warning-500';
      case 'info':
        return 'text-primary-400';
      case 'debug':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return 'badge-error';
      case 'warn':
        return 'badge-warning';
      case 'info':
        return 'badge-info';
      default:
        return 'text-gray-400 bg-gray-800';
    }
  };

  const handleDownloadLogs = () => {
    const content = filteredLogs
      .map((log) => `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.service}] ${log.message}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zeroconfig-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      setLogs([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Logs</h1>
          <p className="mt-1 text-sm text-gray-400">
            View and search service logs in real-time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`btn-secondary flex items-center space-x-2 ${
              autoScroll ? 'bg-primary-600 text-white' : ''
            }`}
          >
            {autoScroll ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{autoScroll ? 'Pause' : 'Resume'}</span>
          </button>
          <button onClick={handleDownloadLogs} className="btn-secondary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
          <button onClick={handleClearLogs} className="btn-danger flex items-center space-x-2">
            <Trash2 className="h-4 w-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="input"
          >
            <option value="all">All Services</option>
            {services.map((service) => (
              <option key={service.name} value={service.name}>
                {service.name}
              </option>
            ))}
          </select>
          <select
            value={logLevel}
            onChange={(e) => setLogLevel(e.target.value)}
            className="input"
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
          <div className="flex items-center justify-between rounded-lg bg-gray-800 px-4 py-2">
            <span className="text-sm text-gray-400">Total Logs:</span>
            <span className="text-sm font-semibold text-white">{filteredLogs.length}</span>
          </div>
        </div>
      </div>

      {/* Logs Viewer */}
      <div className="card overflow-hidden">
        <div className="h-[600px] overflow-y-auto bg-gray-950 p-4 font-mono text-sm">
          {filteredLogs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              No logs to display
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className="group flex items-start space-x-3 rounded px-2 py-1 hover:bg-gray-900"
                >
                  <span className="text-gray-500">{log.timestamp}</span>
                  <span className={`badge ${getLevelBadge(log.level)} uppercase`}>
                    {log.level}
                  </span>
                  <span className="text-primary-400">[{log.service}]</span>
                  <span className={getLevelColor(log.level)}>{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Log Statistics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="card p-4">
          <div className="text-sm text-gray-400">Error Logs</div>
          <div className="mt-2 text-2xl font-semibold text-error-500">
            {logs.filter((l) => l.level === 'error').length}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-400">Warning Logs</div>
          <div className="mt-2 text-2xl font-semibold text-warning-500">
            {logs.filter((l) => l.level === 'warn').length}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-400">Info Logs</div>
          <div className="mt-2 text-2xl font-semibold text-primary-400">
            {logs.filter((l) => l.level === 'info').length}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-400">Debug Logs</div>
          <div className="mt-2 text-2xl font-semibold text-gray-500">
            {logs.filter((l) => l.level === 'debug').length}
          </div>
        </div>
      </div>
    </div>
  );
}
