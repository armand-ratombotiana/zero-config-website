# ZeroConfig Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [Module Breakdown](#module-breakdown)
6. [Design Decisions](#design-decisions)
7. [Extension Points](#extension-points)

---

## Overview

ZeroConfig is built as a multi-layered system with the Rust core engine at its heart. The architecture follows these principles:

- **Separation of Concerns**: Each module has a single, well-defined responsibility
- **Async-First**: Built on Tokio for high-performance async operations
- **Plugin Architecture**: Extensible through a dynamic plugin system
- **Type Safety**: Leverages Rust's type system for correctness guarantees
- **Error Handling**: Comprehensive error types using `anyhow` and `thiserror`

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                          User Interface Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   CLI        │  │   Desktop    │  │   Web UI     │            │
│  │   (Clap)     │  │   (Tauri)    │  │   (React)    │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
└─────────┼──────────────────┼──────────────────┼───────────────────┘
          │                  │                  │
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼───────────────────┐
│                      Core Engine API                               │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                  Command Router                           │    │
│  │   (Routes commands to appropriate handlers)               │    │
│  └────────────────────┬─────────────────────────────────────┘    │
└───────────────────────┼────────────────────────────────────────────┘
                        │
┌───────────────────────▼────────────────────────────────────────────┐
│                      Business Logic Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Engine     │  │   Runtime    │  │   Service    │            │
│  │   Manager    │  │   Manager    │  │   Manager    │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                  │                  │                    │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐            │
│  │   Config     │  │   Port       │  │   Secret     │            │
│  │   Parser     │  │   Allocator  │  │   Manager    │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└───────────────────────┬────────────────────────────────────────────┘
                        │
┌───────────────────────▼────────────────────────────────────────────┐
│                  Container Orchestration Layer                     │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              ContainerOrchestrator                        │    │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │   │   Docker     │  │   Network    │  │   Volume     │  │    │
│  │   │   Client     │  │   Manager    │  │   Manager    │  │    │
│  │   └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  └──────────────────────────────────────────────────────────┘    │
└───────────────────────┬────────────────────────────────────────────┘
                        │
┌───────────────────────▼────────────────────────────────────────────┐
│                    Container Runtime (Docker/Podman)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │PostgreSQL│ │  Redis   │ │  Kafka   │ │LocalStack│ ...        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
└────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Config Module (`src/config/`)

**Responsibility**: Parse and validate `zero.yml` configuration files

**Key Types**:
- `ZeroConfig`: Main configuration structure
- `ServiceConfig`: Service-specific configuration
- `CloudConfig`: Cloud emulation settings
- `PortConfig`: Port allocation strategy

**Methods**:
- `from_file()`: Load config from file path
- `from_str()`: Parse config from string
- `validate()`: Validate configuration correctness
- `discover()`: Find zero.yml in current/parent directories

```rust
pub struct ZeroConfig {
    pub languages: HashMap<String, String>,
    pub services: HashMap<String, ServiceConfig>,
    pub cloud: Option<CloudConfig>,
    pub env: HashMap<String, String>,
    pub ports: PortConfig,
    pub startup: Vec<String>,
    pub metadata: ProjectMetadata,
}
```

---

### 2. Orchestrator Module (`src/orchestrator/`)

**Responsibility**: Manage Docker containers and networks

**Key Types**:
- `ContainerOrchestrator`: Main orchestrator
- `ServiceTemplate`: Templates for common services

**Core Operations**:
1. **Network Management**
   - Create project-specific Docker network
   - Isolate services within network
   - Enable service discovery

2. **Image Management**
   - Pull required Docker images
   - Cache images locally
   - Track image versions

3. **Container Lifecycle**
   - Create containers with proper config
   - Start/stop containers
   - Monitor container health
   - Clean up on shutdown

**Example Flow**:
```rust
let orchestrator = ContainerOrchestrator::new("my-project").await?;
orchestrator.create_network().await?;
orchestrator.pull_image("postgres:16").await?;
orchestrator.start_service("postgres", &config, 5432).await?;
```

---

### 3. Runtime Module (`src/runtime/`)

**Responsibility**: Detect and validate programming language runtimes

**Key Types**:
- `RuntimeManager`: Manages runtime checks
- `RuntimeInfo`: Information about a runtime

**Detection Process**:
1. Execute version command (e.g., `node --version`)
2. Parse version output
3. Compare with required version
4. Report compatibility status

**Supported Runtimes**:
- Node.js
- Python
- Go
- Rust
- Java
- .NET
- Ruby
- PHP
- Docker

**Version Matching**:
- Exact match: `"20.11.0"` matches `20.11.0`
- Major match: `"20"` matches `20.x.x`
- Special: `"latest"` or `"stable"` matches any version

---

### 4. Core Engine (`src/core/`)

**Responsibility**: Coordinate all components to manage the development environment

**Key Type**: `Engine`

```rust
pub struct Engine {
    project_name: String,
    config: ZeroConfig,
    orchestrator: ContainerOrchestrator,
    allocated_ports: HashMap<String, u16>,
}
```

**Lifecycle**:

1. **Initialization**
   ```rust
   let engine = Engine::new("my-app", config).await?;
   ```
   - Load configuration
   - Initialize orchestrator
   - Prepare resource allocation

2. **Build Phase**
   ```rust
   engine.build().await?;
   ```
   - Create Docker network
   - Allocate ports for services
   - Pull required images
   - Prepare volumes

3. **Start Phase**
   ```rust
   engine.start().await?;
   ```
   - Start all configured services
   - Wait for health checks
   - Execute startup commands
   - Generate connection strings

4. **Stop Phase**
   ```rust
   engine.stop().await?;
   ```
   - Gracefully stop all containers
   - Clean up resources
   - Preserve volumes (unless --volumes flag)

---

### 5. CLI Module (`src/cli/`)

**Responsibility**: Provide command-line interface

**Structure**:
```rust
pub struct Cli {
    pub command: Commands,
    pub verbose: bool,
    pub project_dir: Option<String>,
}

pub enum Commands {
    Init { name: Option<String>, template: Option<String> },
    Up { build: bool, detach: bool },
    Down { volumes: bool },
    BuildEnv,
    Doctor,
    Logs { service: Option<String>, follow: bool, tail: usize },
    // ... more commands
}
```

**Command Flow**:
```
User Input → CLI Parser → Command Handler → Engine API → Container Orchestrator
```

---

## Data Flow

### Example: `zero up` Command

```
1. User runs: zero up
   ↓
2. CLI parses command and options
   ↓
3. Discover zero.yml in current directory
   ↓
4. Parse and validate configuration
   ↓
5. Initialize Engine with config
   ↓
6. Engine.build():
   - Create Docker network
   - Allocate ports for each service
   ↓
7. Engine.start():
   - For each service:
     a. Get service template (postgres, redis, etc.)
     b. Pull Docker image if needed
     c. Create container with:
        - Port bindings
        - Environment variables
        - Volume mounts
        - Network connection
     d. Start container
     e. Wait for readiness
   ↓
8. Display success message with service URLs
   ↓
9. If not detached, wait for Ctrl+C
   ↓
10. On shutdown: Engine.stop()
    - Stop all containers
    - Clean up resources
```

---

## Module Breakdown

### `/src/config/mod.rs`
- **Lines**: ~250
- **Dependencies**: serde, serde_yaml, anyhow
- **Tests**: Config parsing, validation
- **Exports**: ZeroConfig, ServiceConfig, CloudConfig

### `/src/orchestrator/mod.rs`
- **Lines**: ~400
- **Dependencies**: bollard, futures, tracing
- **Key Functions**:
  - `create_network()`
  - `pull_image()`
  - `start_service()`
  - `stop_service()`
  - `list_containers()`

### `/src/runtime/mod.rs`
- **Lines**: ~300
- **Dependencies**: std::process, anyhow
- **Key Functions**:
  - `check_runtime()`
  - `get_installed_version()`
  - `is_version_compatible()`
  - `check_docker()`

### `/src/core/mod.rs`
- **Lines**: ~200
- **Dependencies**: All other modules
- **Key Methods**:
  - `new()`
  - `build()`
  - `start()`
  - `stop()`
  - `list_services()`

### `/src/cli/mod.rs`
- **Lines**: ~200
- **Dependencies**: clap
- **Defines**: All CLI commands and their arguments

### `/src/main.rs`
- **Lines**: ~400
- **Dependencies**: All modules
- **Role**: Entry point, command routing, error handling

---

## Design Decisions

### 1. Why Rust?

**Chosen**: Rust
**Alternatives Considered**: Go, TypeScript/Node.js
**Reasoning**:
- **Performance**: Near-native speed for CLI responsiveness
- **Memory Safety**: No garbage collector, guaranteed safety
- **Concurrency**: Async/await for orchestrating multiple services
- **Ecosystem**: Excellent libraries (Bollard, Tokio, Clap)
- **Reliability**: Type system catches errors at compile time

### 2. Why Bollard for Docker?

**Chosen**: Bollard
**Alternatives Considered**: docker_api, shiplift
**Reasoning**:
- Most actively maintained
- Full Docker API coverage
- Async-first design
- Well-documented
- Type-safe API

### 3. Why YAML for Config?

**Chosen**: YAML
**Alternatives Considered**: TOML, JSON, Custom DSL
**Reasoning**:
- Familiar to developers (docker-compose, k8s)
- Human-readable
- Supports comments
- Easy to version control
- Good Rust ecosystem support

### 4. Async vs Sync?

**Chosen**: Async (Tokio)
**Alternatives Considered**: Synchronous
**Reasoning**:
- Need to manage multiple containers concurrently
- I/O-bound operations (Docker API calls)
- Better resource utilization
- Non-blocking UI updates

---

## Extension Points

### 1. Plugin System (Future)

```rust
pub trait ZeroConfigPlugin {
    fn name(&self) -> &str;
    fn version(&self) -> &str;
    fn on_init(&self, config: &ZeroConfig) -> Result<()>;
    fn on_service_start(&self, service: &str) -> Result<()>;
    fn on_service_stop(&self, service: &str) -> Result<()>;
}
```

**Use Cases**:
- Custom service templates
- Pre/post-start hooks
- Custom cloud providers
- Telemetry integration

### 2. Service Templates

Add new services by implementing:

```rust
impl ServiceTemplate for CustomService {
    fn name(&self) -> &str { "custom" }
    fn default_image(&self) -> &str { "custom:latest" }
    fn default_port(&self) -> u16 { 8080 }
    fn env_vars(&self) -> Vec<String> { vec![] }
}
```

### 3. Runtime Detectors

Add new runtime support:

```rust
fn detect_custom_runtime() -> Option<String> {
    // Execute version command
    // Parse output
    // Return version string
}
```

### 4. Cloud Providers

Extend cloud emulation:

```rust
pub trait CloudProvider {
    fn start(&self) -> Result<()>;
    fn stop(&self) -> Result<()>;
    fn status(&self) -> Result<CloudStatus>;
}
```

---

## Performance Considerations

### Concurrent Operations

Services are started concurrently using `tokio::spawn`:

```rust
let mut handles = vec![];
for (service_name, config) in services {
    let handle = tokio::spawn(async move {
        orchestrator.start_service(service_name, config).await
    });
    handles.push(handle);
}
futures::future::join_all(handles).await;
```

### Caching

- Docker images are cached locally
- Configuration is parsed once and reused
- Runtime checks are cached per session

### Resource Management

- Containers are stopped gracefully
- Networks are cleaned up on shutdown
- Volumes persist unless explicitly removed

---

## Security

### Secrets Management

- Auto-generated secrets use `rand` with cryptographically secure RNG
- Secrets are never logged
- Environment variables are scoped to containers

### Container Isolation

- Each project has its own Docker network
- Services cannot access other projects
- Port bindings limited to localhost by default

### File Permissions

- Configuration files are read-only during execution
- Volume mounts are explicit and controlled

---

## Future Enhancements

### Desktop App (Tauri)

```
zeroconfig-desktop/
├── src-tauri/          # Rust backend
│   ├── main.rs         # Tauri entry point
│   └── commands.rs     # Tauri commands
└── src/                # Frontend
    ├── App.tsx
    └── components/
```

### Web UI (Axum + React)

```rust
// Embedded web server
let app = Router::new()
    .route("/api/services", get(list_services))
    .route("/api/logs/:service", get(get_logs))
    .layer(CorsLayer::permissive());

axum::Server::bind(&addr)
    .serve(app.into_make_service())
    .await?;
```

### Metrics & Monitoring

```rust
pub struct Metrics {
    pub cpu_usage: f64,
    pub memory_usage: u64,
    pub network_io: NetworkStats,
    pub disk_io: DiskStats,
}
```

---

## Testing Strategy

### Unit Tests
- Config parsing
- Version comparison
- Port allocation

### Integration Tests
- Full lifecycle (init → up → down)
- Multi-service orchestration
- Error handling

### End-to-End Tests
- Real Docker containers
- Actual service connections
- Performance benchmarks

---

## Conclusion

ZeroConfig's architecture is designed for:
- **Simplicity**: Easy to understand and extend
- **Performance**: Fast startup and responsive CLI
- **Reliability**: Type-safe, well-tested
- **Extensibility**: Plugin system and service templates
- **Developer Experience**: Comprehensive CLI and clear error messages

The Rust core provides a solid foundation for a tool that developers can rely on for their daily workflow.
