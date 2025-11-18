use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "zero")]
#[command(author = "ZeroConfig Team")]
#[command(version = "0.1.0")]
#[command(about = "Universal Developer Environment Automation Engine", long_about = None)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,

    /// Enable verbose logging
    #[arg(short, long, global = true)]
    pub verbose: bool,

    /// Project directory (defaults to current directory)
    #[arg(short, long, global = true)]
    pub project_dir: Option<String>,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Initialize a new ZeroConfig project
    Init {
        /// Project name
        #[arg(short, long)]
        name: Option<String>,

        /// Template to use (node, python, rust, go, java, fullstack)
        #[arg(short, long)]
        template: Option<String>,
    },

    /// Start the development environment
    Up {
        /// Rebuild containers before starting
        #[arg(short, long)]
        build: bool,

        /// Detach and run in background
        #[arg(short, long)]
        detach: bool,
    },

    /// Stop the development environment
    Down {
        /// Remove volumes as well
        #[arg(short, long)]
        volumes: bool,
    },

    /// Build the environment without starting
    BuildEnv,

    /// Check system requirements and configuration
    Doctor,

    /// View logs from services
    Logs {
        /// Service name to view logs for
        service: Option<String>,

        /// Follow log output
        #[arg(short, long)]
        follow: bool,

        /// Number of lines to show
        #[arg(short, long, default_value = "100")]
        tail: usize,
    },

    /// Manage cloud emulation
    Cloud {
        #[command(subcommand)]
        action: CloudCommands,
    },

    /// Open a shell in a service container
    Shell {
        /// Service name
        service: String,

        /// Shell to use (bash, sh, zsh)
        #[arg(short, long, default_value = "bash")]
        shell: String,
    },

    /// Execute a command in a service container
    Exec {
        /// Service name
        service: String,

        /// Command to execute
        command: Vec<String>,
    },

    /// Monitor resource usage
    Monitor {
        /// Refresh interval in seconds
        #[arg(short, long, default_value = "2")]
        interval: u64,
    },

    /// List all running services
    Ps,

    /// Restart services
    Restart {
        /// Specific services to restart (restart all if none specified)
        services: Vec<String>,
    },

    /// View environment variables
    Env {
        /// Export format (shell, json, yaml)
        #[arg(short, long, default_value = "shell")]
        format: String,
    },

    /// Generate configuration files
    Generate {
        #[command(subcommand)]
        target: GenerateCommands,
    },

    /// Check health of running services
    Health {
        /// Specific service to check (optional)
        service: Option<String>,

        /// Wait for service to become healthy
        #[arg(short, long)]
        wait: bool,

        /// Timeout in seconds when waiting
        #[arg(short, long, default_value = "60")]
        timeout: u64,
    },

    /// Backup database services
    Backup {
        /// Service to backup
        service: String,

        /// Output directory for backup
        #[arg(short, long, default_value = "./backups")]
        output: String,
    },

    /// Restore database services
    Restore {
        /// Service to restore
        service: String,

        /// Backup file to restore from
        file: String,
    },
}

#[derive(Subcommand)]
pub enum CloudCommands {
    /// Start cloud emulation (LocalStack, etc.)
    Start {
        /// Cloud provider (aws, azure, gcp)
        provider: String,
    },

    /// Stop cloud emulation
    Stop,

    /// Get cloud emulation status
    Status,

    /// Open cloud UI in browser
    Ui,
}

#[derive(Subcommand)]
pub enum GenerateCommands {
    /// Generate Dockerfile
    Dockerfile,

    /// Generate docker-compose.yml
    Compose,

    /// Generate environment files
    Env,

    /// Generate GitHub Actions workflow
    GithubActions,

    /// Generate all configuration files
    All,
}

impl Cli {
    pub fn parse_args() -> Self {
        Self::parse()
    }
}
