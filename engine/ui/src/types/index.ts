// Core ZeroConfig Types

export interface Service {
  name: string;
  image: string;
  status: ServiceStatus;
  port?: number;
  healthStatus?: HealthStatus;
  stats?: ContainerStats;
  config: ServiceConfig;
}

export enum ServiceStatus {
  Running = 'running',
  Stopped = 'stopped',
  Starting = 'starting',
  Error = 'error',
  Unknown = 'unknown',
}

export interface ServiceConfig {
  image: string;
  port?: PortConfig;
  environment?: Record<string, string>;
  volumes?: string[];
  healthCheck?: HealthCheckConfig;
}

export interface PortConfig {
  internal: number;
  external?: number | 'auto';
}

export interface HealthCheckConfig {
  cmd: string[];
  interval?: number;
  timeout?: number;
  retries?: number;
}

export interface HealthStatus {
  serviceName: string;
  isHealthy: boolean;
  statusMessage: string;
  responseTimeMs: number;
  lastCheck: string;
}

export interface ContainerStats {
  cpu: number;
  memory: {
    used: number;
    limit: number;
    percentage: number;
  };
  network: {
    rx: number;
    tx: number;
  };
}

export interface ZeroConfig {
  metadata: {
    name?: string;
    version?: string;
    description?: string;
  };
  services: Record<string, ServiceConfig>;
  runtimes?: Record<string, RuntimeConfig>;
  env?: Record<string, string>;
}

export interface RuntimeConfig {
  version: string;
  manager?: string;
}

export interface CloudEmulator {
  provider: 'aws' | 'azure' | 'gcp';
  status: ServiceStatus;
  endpoint?: string;
  services?: string[];
}

export interface LogEntry {
  timestamp: string;
  service: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface ProjectInfo {
  path: string;
  config: ZeroConfig;
  services: Service[];
  cloudEmulators: CloudEmulator[];
}

// Template Types
export interface Template {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  languages: string[];
  services: string[];
}

export const AVAILABLE_TEMPLATES: Template[] = [
  {
    name: 'default',
    displayName: 'Default',
    description: 'Basic project with Node.js and PostgreSQL',
    icon: '📦',
    languages: ['node'],
    services: ['postgres'],
  },
  {
    name: 'node',
    displayName: 'Node.js',
    description: 'Node.js application with PostgreSQL and Redis',
    icon: '🟢',
    languages: ['node'],
    services: ['postgres', 'redis'],
  },
  {
    name: 'python',
    displayName: 'Python',
    description: 'Python application with PostgreSQL and Redis',
    icon: '🐍',
    languages: ['python'],
    services: ['postgres', 'redis'],
  },
  {
    name: 'rust',
    displayName: 'Rust',
    description: 'Rust application with PostgreSQL and Redis',
    icon: '🦀',
    languages: ['rust'],
    services: ['postgres', 'redis'],
  },
  {
    name: 'go',
    displayName: 'Go',
    description: 'Go application with PostgreSQL and Redis',
    icon: '🔵',
    languages: ['go'],
    services: ['postgres', 'redis'],
  },
  {
    name: 'fullstack',
    displayName: 'Full Stack',
    description: 'Complete stack with Node.js, Python, and multiple services',
    icon: '🚀',
    languages: ['node', 'python'],
    services: ['postgres', 'redis', 'mongodb', 'rabbitmq'],
  },
];

// Available Languages
export const AVAILABLE_LANGUAGES = [
  { value: 'node', label: 'Node.js', icon: '🟢', versions: ['18', '20', '21'] },
  { value: 'python', label: 'Python', icon: '🐍', versions: ['3.9', '3.10', '3.11', '3.12'] },
  { value: 'rust', label: 'Rust', icon: '🦀', versions: ['stable', 'nightly', '1.75'] },
  { value: 'go', label: 'Go', icon: '🔵', versions: ['1.21', '1.22', '1.23'] },
  { value: 'java', label: 'Java', icon: '☕', versions: ['11', '17', '21'] },
  { value: 'php', label: 'PHP', icon: '🐘', versions: ['8.1', '8.2', '8.3'] },
  { value: 'ruby', label: 'Ruby', icon: '💎', versions: ['3.0', '3.1', '3.2'] },
];

// Available Services
export const AVAILABLE_SERVICES = [
  {
    value: 'postgres',
    label: 'PostgreSQL',
    icon: '🐘',
    description: 'Relational database',
    versions: ['14', '15', '16'],
    defaultPort: 5432,
  },
  {
    value: 'redis',
    label: 'Redis',
    icon: '🔴',
    description: 'In-memory cache',
    versions: ['6', '7', 'latest'],
    defaultPort: 6379,
  },
  {
    value: 'mongodb',
    label: 'MongoDB',
    icon: '🍃',
    description: 'NoSQL database',
    versions: ['6', '7', 'latest'],
    defaultPort: 27017,
  },
  {
    value: 'mysql',
    label: 'MySQL',
    icon: '🐬',
    description: 'Relational database',
    versions: ['8.0', '8.1', 'latest'],
    defaultPort: 3306,
  },
  {
    value: 'rabbitmq',
    label: 'RabbitMQ',
    icon: '🐰',
    description: 'Message queue',
    versions: ['3', '3-management', 'latest'],
    defaultPort: 5672,
  },
  {
    value: 'elasticsearch',
    label: 'Elasticsearch',
    icon: '🔍',
    description: 'Search engine',
    versions: ['8.0', '8.11', 'latest'],
    defaultPort: 9200,
  },
];

// Cloud Providers
export const CLOUD_PROVIDERS = [
  {
    value: 'aws',
    label: 'AWS (LocalStack)',
    icon: '☁️',
    description: 'Amazon Web Services emulation',
    services: ['S3', 'DynamoDB', 'SQS', 'SNS', 'Lambda'],
  },
  {
    value: 'azure',
    label: 'Azure (Azurite)',
    icon: '🔷',
    description: 'Microsoft Azure Storage emulation',
    services: ['Blob Storage', 'Queue Storage', 'Table Storage'],
  },
  {
    value: 'gcp',
    label: 'GCP',
    icon: '🌐',
    description: 'Google Cloud Platform emulation',
    services: ['Firestore', 'Pub/Sub', 'Bigtable'],
  },
];