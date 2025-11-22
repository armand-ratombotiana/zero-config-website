import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Download, Trash2, Play, Pause, Pin, PinOff, Copy, Check, FileText, BarChart2, Filter, Regex } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Service } from '../types';
import clsx from 'clsx';

interface LogsProps {
  services: Service[];
  projectPath?: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  service: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  pinned?: boolean;
}

export function Logs({ services, projectPath = '' }: LogsProps) {
  const [selectedService, setSelectedService] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [logLevel, setLogLevel] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pinnedLogs, setPinnedLogs] = useState<Set<string>>(new Set());
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Parse log line into structured format
  const parseLogLine = (line: string, serviceName: string): LogEntry | null => {
    if (!line.trim()) return null;

    let level: 'info' | 'warn' | 'error' | 'debug' = 'info';
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('error') || lowerLine.includes('fatal') || lowerLine.includes('exception')) {
      level = 'error';
    } else if (lowerLine.includes('warn') || lowerLine.includes('warning')) {
      level = 'warn';
    } else if (lowerLine.includes('debug') || lowerLine.includes('trace')) {
      level = 'debug';
    }

    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})/);
    const timestamp = timestampMatch ? timestampMatch[1].replace('T', ' ') : new Date().toISOString().replace('T', ' ').slice(0, 19);

    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp,
      service: serviceName,
      level,
      message: line.trim(),
    };
  };

  const togglePin = (logId: string) => {
    setPinnedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
    setLogs(prev => prev.map(log =>
      log.id === logId ? { ...log, pinned: !log.pinned } : log
    ));
  };

  const copyToClipboard = async (text: string, logId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(logId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Fetch logs (historical)
  const fetchAllLogs = useCallback(async () => {
    if (!projectPath || services.length === 0) return;

    try {
      const servicesToFetch = selectedService === 'all'
        ? services.map(s => s.name)
        : [selectedService];

      const allLogs: LogEntry[] = [];
      for (const serviceName of servicesToFetch) {
        try {
          const result = await invoke<string>('get_service_logs', {
            projectPath,
            serviceName,
            tail: 200,
          });

          const lines = result.split('\n').filter(line => line.trim());
          const parsed = lines
            .map(line => parseLogLine(line, serviceName))
            .filter((entry): entry is LogEntry => entry !== null);
          allLogs.push(...parsed);
        } catch (e) {
          // Ignore individual service errors
        }
      }

      allLogs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      setLogs(allLogs);
    } catch {
      // Silently ignore errors
    }
  }, [projectPath, services, selectedService]);

  // Real-time streaming
  useEffect(() => {
    if (!projectPath || services.length === 0) return;

    let unlisten: (() => void) | undefined;
    const activeStreams = new Set<string>();

    const setupStreams = async () => {
      // Setup listener
      unlisten = await listen<{ service: string; line: string }>('log-event', (event) => {
        const { service, line } = event.payload;

        // Filter if we only want specific service logs
        if (selectedService !== 'all' && service !== selectedService) return;

        const parsed = parseLogLine(line, service);
        if (parsed) {
          setLogs(prev => {
            const newLogs = [...prev, parsed];
            // Keep last 5000 logs to prevent memory issues
            if (newLogs.length > 5000) {
              return newLogs.slice(newLogs.length - 5000);
            }
            return newLogs;
          });
        }
      });

      // Start streams
      const servicesToStream = selectedService === 'all'
        ? services.map(s => s.name)
        : [selectedService];

      for (const service of servicesToStream) {
        try {
          await invoke('start_log_stream', {
            projectPath,
            serviceName: service,
          });
          activeStreams.add(service);
        } catch (e) {
          console.error(`Failed to start stream for ${service}:`, e);
        }
      }
    };

    // Initial fetch of historical logs
    fetchAllLogs().then(() => {
      setupStreams();
    });

    return () => {
      if (unlisten) unlisten();
      // Stop all active streams
      activeStreams.forEach(service => {
        invoke('stop_log_stream', { serviceName: service }).catch(console.error);
      });
    };
  }, [projectPath, services, selectedService, fetchAllLogs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesService = selectedService === 'all' || log.service === selectedService;
      const matchesLevel = logLevel === 'all' || log.level === logLevel;

      let matchesSearch = true;
      if (searchTerm) {
        if (useRegex) {
          try {
            const regex = new RegExp(searchTerm, 'i');
            matchesSearch = regex.test(log.message) || regex.test(log.service);
          } catch {
            matchesSearch = false;
          }
        } else {
          matchesSearch =
            log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.service.toLowerCase().includes(searchTerm.toLowerCase());
        }
      }

      return matchesService && matchesLevel && matchesSearch;
    });
  }, [logs, selectedService, logLevel, searchTerm, useRegex]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logsEndRef.current && filteredLogs.length > 0) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs.length, autoScroll]);

  // Analytics Data
  const analyticsData = useMemo(() => {
    const buckets: Record<string, { error: number; warn: number; info: number }> = {};

    filteredLogs.forEach(log => {
      const time = log.timestamp.substring(11, 16); // HH:MM
      if (!buckets[time]) buckets[time] = { error: 0, warn: 0, info: 0 };
      if (log.level === 'error') buckets[time].error++;
      else if (log.level === 'warn') buckets[time].warn++;
      else buckets[time].info++;
    });

    return Object.entries(buckets)
      .map(([time, counts]) => ({ time, ...counts }))
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(-20); // Last 20 buckets
  }, [filteredLogs]);


  const handleDownloadLogs = (format: 'txt' | 'json') => {
    let content = '';
    let type = '';
    let filename = `zeroconfig-logs-${new Date().toISOString()}`;

    if (format === 'json') {
      content = JSON.stringify(filteredLogs, null, 2);
      type = 'application/json';
      filename += '.json';
    } else {
      content = filteredLogs
        .map((log) => `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.service}] ${log.message}`)
        .join('\n');
      type = 'text/plain';
      filename += '.txt';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLog = async (log: LogEntry) => {
    await copyToClipboard(`[${log.timestamp}] [${log.level.toUpperCase()}] [${log.service}] ${log.message}`, log.id);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Logs</h1>
          <p className="mt-1 text-sm text-gray-400">
            Real-time service logs and analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={clsx(
              "btn-secondary flex items-center space-x-2",
              showAnalytics && "bg-primary text-white border-primary"
            )}
          >
            <BarChart2 className="h-4 w-4" />
            <span>Analytics</span>
          </button>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={clsx(
              "btn-secondary flex items-center space-x-2",
              autoScroll && "bg-success/10 text-success border-success/20"
            )}
          >
            {autoScroll ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{autoScroll ? 'Live' : 'Paused'}</span>
          </button>
          <div className="dropdown dropdown-end">
            <button className="btn-secondary flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <div className="dropdown-content menu p-2 shadow bg-gray-900 rounded-box w-52 border border-white/10 mt-2">
              <button onClick={() => handleDownloadLogs('txt')} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded text-sm text-gray-300">
                <FileText className="w-4 h-4" /> as Text (.txt)
              </button>
              <button onClick={() => handleDownloadLogs('json')} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded text-sm text-gray-300">
                <FileText className="w-4 h-4" /> as JSON (.json)
              </button>
            </div>
          </div>
          <button onClick={() => setLogs([])} className="btn-danger flex items-center space-x-2">
            <Trash2 className="h-4 w-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="card p-4 h-64 shrink-0 animate-in slide-in-from-top-4 duration-200">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Log Volume by Level (Last 20m)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsData}>
              <defs>
                <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInfo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
              />
              <Area type="monotone" dataKey="error" stackId="1" stroke="#EF4444" fill="url(#colorError)" />
              <Area type="monotone" dataKey="warn" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
              <Area type="monotone" dataKey="info" stackId="1" stroke="#3B82F6" fill="url(#colorInfo)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Controls */}
      <div className="card p-4 shrink-0">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={useRegex ? "Search with Regex..." : "Search logs..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={clsx(
                "input pl-9 pr-10 w-full font-mono text-sm",
                useRegex && "border-accent focus:border-accent ring-accent/20"
              )}
            />
            <button
              onClick={() => setUseRegex(!useRegex)}
              className={clsx(
                "absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-700 transition-colors",
                useRegex ? "text-accent" : "text-gray-400"
              )}
              title="Toggle Regex"
            >
              <Regex className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="input py-1.5 text-sm w-40"
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
              className="input py-1.5 text-sm w-32"
            >
              <option value="all">All Levels</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          <div className="ml-auto flex items-center gap-2 text-sm text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded-lg border border-white/5">
            <span>{filteredLogs.length} events</span>
            {pinnedLogs.size > 0 && (
              <>
                <span className="w-px h-3 bg-gray-600" />
                <span className="text-accent">{pinnedLogs.size} pinned</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Virtualized Log List */}
      <div className="flex-1 card overflow-hidden bg-gray-950 border-gray-800">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p>No logs found matching your filters</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={clsx(
                  "flex items-start gap-3 p-3 rounded-lg transition-colors",
                  log.pinned ? "bg-blue-500/10 border border-blue-500/30" : "hover:bg-white/5",
                  log.level === 'error' && "bg-red-500/5 border-l-2 border-red-500",
                  log.level === 'warn' && "bg-yellow-500/5 border-l-2 border-yellow-500"
                )}
              >
                <span className="text-xs text-gray-500 font-mono w-16 shrink-0">{log.timestamp.substring(11, 19)}</span>
                <span className={clsx(
                  "text-xs font-medium w-20 shrink-0",
                  log.level === 'error' && "text-red-400",
                  log.level === 'warn' && "text-yellow-400",
                  log.level === 'info' && "text-blue-400",
                  log.level === 'debug' && "text-gray-400"
                )}>
                  {log.level.toUpperCase()}
                </span>
                <span className="text-xs text-gray-400 w-24 shrink-0">{log.service}</span>
                <span className="text-sm text-white flex-1 font-mono break-all">{log.message}</span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => togglePin(log.id)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title={log.pinned ? "Unpin" : "Pin"}
                  >
                    {log.pinned ? <PinOff className="w-3 h-3 text-blue-400" /> : <Pin className="w-3 h-3 text-gray-400" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(log.message, log.id)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Copy"
                  >
                    {copiedId === log.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                  </button>
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
