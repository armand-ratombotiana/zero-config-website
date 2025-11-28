# ZeroConfig

ZeroConfig is a developer tool designed to simplify the management of local development environments. It auto-detects your project stack and spins up the necessary services (databases, caches, etc.) using Docker or Podman, without requiring you to write complex configuration files manually.

## Features

*   **Zero Configuration**: Auto-detects your project's technology stack and suggests appropriate services.
*   **Multi-Runtime Support**: Works with both Docker and Podman.
*   **Visual Configuration Editor**: Edit your `zero.yml` configuration file using a visual interface or a built-in YAML editor.
*   **Real-time Logs**: Stream logs from your running services directly in the application.
*   **Interactive Terminal**: Open a terminal window connected to your running containers with a single click.
*   **Cloud Emulation**: Emulate cloud services (AWS S3, SQS, etc.) locally using LocalStack.
*   **Dashboard**: Monitor the status and resource usage of your services in real-time.
*   **Generators**: Generate standard configuration files like `Dockerfile`, `docker-compose.yml`, and GitHub Actions workflows.

## Getting Started

### Prerequisites

*   **Rust**: Required to build the backend.
*   **Node.js & npm**: Required to build the frontend.
*   **Docker** or **Podman**: Container runtime.
*   **C/C++ Build Tools**: (Windows only) MinGW or Visual Studio Build Tools are required for building the Tauri backend.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/zero-config.git
    cd zero-config
    ```

2.  **Install Frontend Dependencies**:
    ```bash
    cd engine/ui
    npm install
    ```

3.  **Run the Application**:
    ```bash
    npm run tauri dev
    ```

## Usage

### CLI Usage

```bash
# Initialize a new project
zc init --template fullstack

# Start your development environment
zc up

# Check system requirements
zc doctor

# View running services
zc ps

# View logs
zc logs postgres

# Stop environment
zc down
```

### Desktop UI Usage

1.  **Open a Project**: Launch ZeroConfig and open your project directory.
2.  **Auto-Detection**: ZeroConfig will scan your project and suggest services.
3.  **Start Services**: Click "Start All" to spin up your environment.
4.  **Manage Services**: View logs, open terminals, and monitor resource usage from the dashboard.
5.  **Configure**: Use the Configuration tab to tweak your `zero.yml` or generate deployment files.

## Architecture

*   **Backend**: Rust (Tauri) - Handles system interactions, container orchestration, and file operations.
*   **Frontend**: React, TypeScript, Tailwind CSS - Provides a modern and responsive user interface.
*   **Core Library**: `zeroconfig-core` - A reusable Rust library for container management and configuration parsing.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT