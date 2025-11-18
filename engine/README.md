# ZeroConfig - Universal Developer Environment Automation Engine

<div align="center">

![ZeroConfig Logo](https://via.placeholder.com/150)

**The ultimate zero-configuration developer environment automation tool**

[![Rust](https://img.shields.io/badge/rust-1.75+-orange.svg)](https://www.rust-lang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

[Features](#features) • [Installation](#installation) • [Quick Start](#quick-start) • [Documentation](#documentation)

</div>

---

## 🎯 What is ZeroConfig?

ZeroConfig is a next-generation **Universal Developer Environment Automation Engine** built with Rust. It eliminates ALL setup, configuration, and environment conflicts for developers by automatically:

- ✅ Detecting project type and dependencies
- ✅ Validating required runtimes (Node, Python, Go, Rust, Java, .NET)
- ✅ Creating isolated environments
- ✅ Running services (PostgreSQL, Redis, MongoDB, Kafka, etc.)
- ✅ Generating runtime configs
- ✅ Managing secrets
- ✅ Handling cloud/local resources
- ✅ Providing unified CLI + Desktop + Web UI

**ZeroConfig answers a fundamental problem:**
> "Developers should focus on coding, not configuring environments."

---

## 🚀 Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **Zero Configuration** | Automatic project detection and environment setup |
| **Multi-Runtime Support** | Node.js, Python, Go, Rust, Java, .NET, Ruby, PHP |
| **Service Orchestration** | PostgreSQL, MySQL, MongoDB, Redis, Kafka, RabbitMQ, Elasticsearch, MinIO |
| **Cloud Emulation** | LocalStack for AWS, Azure, GCP emulation |
| **Automatic Port Management** | No more port conflicts |
| **Secret Generation** | Auto-generate secure secrets and API keys |
| **Hot Reload** | Instant environment updates |
| **Cross-Platform** | Windows, macOS, Linux |

### Why ZeroConfig vs Traditional Tools?

| Tool | ZeroConfig | Docker Compose | Dockerfile | IDE |
|------|-----------|----------------|------------|-----|
| **Auto-detect stack** | ✅ | ❌ | ❌ | ❌ |
| **Runtime versioning** | ✅ | ❌ | ❌ | ⚠️ |
| **Service orchestration** | ✅ | ✅ | ❌ | ❌ |
| **Cloud emulation** | ✅ | ⚠️ | ❌ | ❌ |
| **Secrets management** | ✅ | ⚠️ | ❌ | ❌ |
| **One command setup** | ✅ | ❌ | ❌ | ❌ |
| **Multi-language** | ✅ | ⚠️ | ⚠️ | ✅ |
| **Desktop UI** | ✅ | ❌ | ❌ | ✅ |

---

## 📦 Installation

### Prerequisites

- **Docker** or **Podman** (for container orchestration)
- **Rust** 1.75+ (for building from source)

### Install via Cargo

```bash
cargo install zeroconfig
```

### Build from Source

```bash
git clone https://github.com/zeroconfig/zeroconfig-engine.git
cd zeroconfig-engine
cargo build --release
```

The binary will be available at `target/release/zeroconfig`.

---

## 🏃 Quick Start

### 1. Initialize a New Project

```bash
zero init --template fullstack
```

This creates a `zero.yml` configuration file:

```yaml
metadata:
  name: my-fullstack-app
  description: Full-stack application
  version: 1.0.0

languages:
  node: "20"
  python: "3.11"

services:
  postgres:
    version: "16"
    port: auto
  redis:
    version: "latest"
    port: auto

cloud:
  localstack: full

env:
  MODE: development
  DATABASE_URL: auto-generate
  REDIS_URL: auto-generate

ports: auto

startup:
  - npm install
  - pip install -r requirements.txt
  - npm run dev
```

### 2. Check System Requirements

```bash
zero doctor
```

Output:
```
🩺 Running system diagnostics...

Checking Docker...
  ✓ Docker is installed and running

Checking runtimes...
  ✓ node 20.11.0
  ✓ python 3.11.5

✅ All checks passed!
```

### 3. Start Your Environment

```bash
zero up
```

Output:
```
🚀 Starting development environment...
🔄 Starting services...
  ✓ postgres (port 5432)
  ✓ redis (port 6379)
✅ Environment is ready!
```

### 4. View Running Services

```bash
zero ps
```

---

## 📖 CLI Commands

### Project Management

```bash
zero init [--name <name>] [--template <template>]  # Initialize new project
zero up [--build] [--detach]                       # Start environment
zero down [--volumes]                              # Stop environment
zero build-env                                     # Build without starting
zero restart [service...]                          # Restart services
```

### Diagnostics

```bash
zero doctor                                        # Check system requirements
zero ps                                           # List running services
zero logs [service] [--follow] [--tail 100]       # View logs
zero monitor [--interval 2]                       # Monitor resource usage
```

### Service Interaction

```bash
zero shell <service> [--shell bash]               # Open shell in service
zero exec <service> <command...>                  # Execute command
zero env [--format json|yaml|shell]               # View environment variables
```

### Code Generation

```bash
zero generate dockerfile                          # Generate Dockerfile
zero generate compose                             # Generate docker-compose.yml
zero generate env                                 # Generate .env files
zero generate github-actions                      # Generate CI/CD workflow
zero generate all                                 # Generate all files
```

### Cloud Emulation

```bash
zero cloud start <provider>                       # Start cloud emulation
zero cloud stop                                   # Stop cloud emulation
zero cloud status                                 # Check status
zero cloud ui                                     # Open cloud UI
```

---

## 📋 zero.yml Configuration

### Full Configuration Example

```yaml
metadata:
  name: my-microservices-app
  description: Microservices architecture
  version: 2.0.0
  team: backend-team

languages:
  node: "20"
  python: "3.11"
  go: "1.23"
  rust: "stable"
  java: "22"
  dotnet: "8.0"

services:
  # Databases
  postgres:
    version: "16"
    port: auto
    environment:
      POSTGRES_DB: myapp
    volumes:
      - ./data/postgres:/var/lib/postgresql/data

  mongodb:
    version: "7"
    port: auto

  mysql:
    version: "8"
    port: auto

  # Caching & Queues
  redis:
    version: "latest"
    port: auto

  kafka:
    version: "latest"
    port: auto

  rabbitmq:
    version: "3-management"
    port: auto

  # Search & Storage
  elasticsearch:
    version: "8.11"
    port: auto

  minio:
    version: "latest"
    port: auto

  # Monitoring
  prometheus:
    version: "latest"
    port: auto

  grafana:
    version: "latest"
    port: auto

cloud:
  localstack:
    services:
      - s3
      - dynamodb
      - sqs
      - sns
      - lambda

  aws:
    services:
      - s3
      - ec2
    region: us-east-1

env:
  MODE: development
  DEBUG: "true"
  DATABASE_URL: auto-generate
  REDIS_URL: auto-generate
  SECRET_KEY: auto-generate
  API_KEY: auto-generate

ports: auto

startup:
  - npm install
  - pip install -r requirements.txt
  - go mod download
  - cargo build
  - npm run dev
```

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   ZeroConfig CLI                    │
│            (Rust - Command Line Interface)          │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│               ZeroConfig Core Engine                 │
│                  (Rust Daemon)                       │
│  ┌──────────────────────────────────────────────┐  │
│  │  Config Parser  │  Runtime Verifier          │  │
│  │  Port Allocator │  Secret Manager            │  │
│  │  Service Mgr    │  Plugin System             │  │
│  └──────────────────────────────────────────────┘  │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│           Container Orchestrator (Bollard)          │
│              Docker / Podman Integration            │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│              Service Containers                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  │ PG   │ │Redis │ │Mongo │ │Kafka │ │LS    │    │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘    │
└─────────────────────────────────────────────────────┘
```

### Component Layers

1. **Layer 1: Rust Core Engine (Daemon)**
   - Container orchestrator
   - Plugin executor
   - Runtime verifier
   - Service lifecycle manager
   - Secret manager
   - Config generator

2. **Layer 2: CLI (Rust)**
   - Commands: init, up, down, doctor, logs, shell, exec, monitor
   - Interactive prompts
   - Colored output

3. **Layer 3: Desktop App (Future)**
   - Built with Tauri
   - System tray controls
   - Visual service inspector
   - Metrics visualizer

4. **Layer 4: Web UI (Future)**
   - Embedded server
   - React/SvelteKit frontend
   - Real-time dashboards
   - API explorer

---

## 🔧 Development

### Project Structure

```
zeroconfig-engine/
├── src/
│   ├── cli/              # CLI command definitions
│   ├── config/           # zero.yml parser
│   ├── core/             # Core engine logic
│   ├── orchestrator/     # Docker/Podman integration
│   ├── runtime/          # Runtime detection & management
│   ├── services/         # Service templates
│   ├── plugins/          # Plugin system
│   ├── api/              # Web API server
│   └── main.rs           # Entry point
├── templates/            # Project templates
├── tests/                # Integration tests
├── Cargo.toml            # Rust dependencies
└── README.md
```

### Running Tests

```bash
cargo test
```

### Running with Debug Logging

```bash
zero --verbose up
```

---

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Rust](https://www.rust-lang.org/)
- Container orchestration via [Bollard](https://github.com/fussybeaver/bollard)
- CLI parsing with [Clap](https://github.com/clap-rs/clap)
- Inspired by Docker Compose, Vagrant, and modern DevOps tools

---

## 📞 Support

- 📧 Email: support@zeroconfig.dev
- 💬 Discord: [Join our community](https://discord.gg/zeroconfig)
- 🐛 Issues: [GitHub Issues](https://github.com/zeroconfig/zeroconfig-engine/issues)
- 📖 Docs: [Documentation](https://docs.zeroconfig.dev)

---

<div align="center">

**Made with ❤️ by the ZeroConfig Team**

[Website](https://zeroconfig.dev) • [Documentation](https://docs.zeroconfig.dev) • [Twitter](https://twitter.com/zeroconfig)

</div>
