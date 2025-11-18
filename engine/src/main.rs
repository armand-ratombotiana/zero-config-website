mod cli;
mod config;
mod core;
mod orchestrator;
mod runtime;
mod services;
mod secrets;

use anyhow::{Context, Result};
use cli::{Cli, Commands, CloudCommands, GenerateCommands};
use colored::Colorize;
use config::ZeroConfig;
use core::Engine;
use tracing::{error, info};
use tracing_subscriber;

#[tokio::main]
async fn main() {
    if let Err(e) = run().await {
        eprintln!("{} {}", "Error:".red().bold(), e);
        std::process::exit(1);
    }
}

async fn run() -> Result<()> {
    let cli = Cli::parse_args();

    // Initialize logging
    let log_level = if cli.verbose { "debug" } else { "info" };
    std::env::set_var("RUST_LOG", log_level);
    tracing_subscriber::fmt()
        .with_target(false)
        .with_thread_ids(false)
        .init();

    // Change to project directory if specified
    if let Some(ref dir) = cli.project_dir {
        std::env::set_current_dir(dir)
            .context("Failed to change to project directory")?;
    }

    match cli.command {
        Commands::Init { name, template } => {
            cmd_init(name, template).await?;
        }
        Commands::Up { build, detach } => {
            cmd_up(build, detach).await?;
        }
        Commands::Down { volumes } => {
            cmd_down(volumes).await?;
        }
        Commands::BuildEnv => {
            cmd_build_env().await?;
        }
        Commands::Doctor => {
            cmd_doctor().await?;
        }
        Commands::Logs { service, follow, tail } => {
            cmd_logs(service, follow, tail).await?;
        }
        Commands::Cloud { action } => {
            cmd_cloud(action).await?;
        }
        Commands::Shell { service, shell } => {
            cmd_shell(service, shell).await?;
        }
        Commands::Exec { service, command } => {
            cmd_exec(service, command).await?;
        }
        Commands::Monitor { interval } => {
            cmd_monitor(interval).await?;
        }
        Commands::Ps => {
            cmd_ps().await?;
        }
        Commands::Restart { services } => {
            cmd_restart(services).await?;
        }
        Commands::Env { format } => {
            cmd_env(format).await?;
        }
        Commands::Generate { target } => {
            cmd_generate(target).await?;
        }
    }

    Ok(())
}

async fn cmd_init(name: Option<String>, template: Option<String>) -> Result<()> {
    println!("{}", "🚀 Initializing ZeroConfig project...".cyan().bold());

    let project_name = name.unwrap_or_else(|| {
        std::env::current_dir()
            .ok()
            .and_then(|p| p.file_name().map(|n| n.to_string_lossy().to_string()))
            .unwrap_or_else(|| "my-project".to_string())
    });

    println!("Project name: {}", project_name.green());

    // Generate zero.yml based on template
    let config_content = generate_template(template.as_deref());

    std::fs::write("zero.yml", config_content)
        .context("Failed to write zero.yml")?;

    println!("{}", "✅ Created zero.yml".green());
    println!("\nNext steps:");
    println!("  1. Edit {} to configure your environment", "zero.yml".yellow());
    println!("  2. Run {} to start your environment", "zero up".cyan());
    println!("  3. Run {} to check system requirements", "zero doctor".cyan());

    Ok(())
}

async fn cmd_up(build: bool, detach: bool) -> Result<()> {
    println!("{}", "🚀 Starting development environment...".cyan().bold());

    let config = match ZeroConfig::discover()? {
        Some(cfg) => cfg,
        None => {
            println!("{}", "Error: No zero.yml found in current directory or parents".red());
            return Ok(());
        }
    };

    config.validate()?;

    let project_name = config.metadata.name
        .clone()
        .unwrap_or_else(|| "zeroconfig-project".to_string());

    let mut engine = Engine::new(project_name, config).await?;

    if build {
        println!("{}", "🔨 Building environment...".yellow());
        engine.build().await?;
    }

    println!("{}", "🔄 Starting services...".yellow());
    engine.start().await?;

    println!("{}", "✅ Environment is ready!".green().bold());

    if !detach {
        println!("\nPress {} to stop", "Ctrl+C".yellow());
        tokio::signal::ctrl_c().await?;
        println!("\n{}", "🛑 Stopping services...".yellow());
        engine.stop().await?;
    }

    Ok(())
}

async fn cmd_down(volumes: bool) -> Result<()> {
    println!("{}", "🛑 Stopping development environment...".yellow().bold());

    let config = match ZeroConfig::discover()? {
        Some(cfg) => cfg,
        None => {
            println!("{}", "Error: No zero.yml found".red());
            return Ok(());
        }
    };

    let project_name = config.metadata.name
        .clone()
        .unwrap_or_else(|| "zeroconfig-project".to_string());

    let engine = Engine::new(project_name, config).await?;
    engine.stop().await?;

    println!("{}", "✅ Environment stopped".green());

    Ok(())
}

async fn cmd_build_env() -> Result<()> {
    println!("{}", "🔨 Building environment...".cyan().bold());

    let config = match ZeroConfig::discover()? {
        Some(cfg) => cfg,
        None => {
            println!("{}", "Error: No zero.yml found".red());
            return Ok(());
        }
    };

    config.validate()?;

    let project_name = config.metadata.name
        .clone()
        .unwrap_or_else(|| "zeroconfig-project".to_string());

    let mut engine = Engine::new(project_name, config).await?;
    engine.build().await?;

    println!("{}", "✅ Environment built successfully".green());

    Ok(())
}

async fn cmd_doctor() -> Result<()> {
    println!("{}", "🩺 Running system diagnostics...".cyan().bold());
    println!();

    let config = match ZeroConfig::discover()? {
        Some(cfg) => cfg,
        None => {
            println!("{}", "No zero.yml found in current directory or parents".yellow());
            return Ok(());
        }
    };

    // Check Docker
    println!("Checking Docker...");
    let mut runtime_mgr = runtime::RuntimeManager::new();
    match runtime_mgr.check_docker().await {
        Ok(true) => println!("  {} Docker is installed and running", "✓".green()),
        Ok(false) => println!("  {} Docker is installed but not running", "✗".red()),
        Err(e) => println!("  {} Docker check failed: {}", "✗".red(), e),
    }

    // Check runtimes
    println!("\nChecking runtimes...");
    for (name, version) in config.get_runtimes() {
        match runtime_mgr.check_runtime(&name, &version).await {
            Ok(info) => {
                if info.is_compatible {
                    println!("  {} {} {}", "✓".green(), name, info.installed_version.unwrap());
                } else {
                    println!("  {} {} (required: {}, installed: {:?})",
                        "✗".red(), name, version, info.installed_version);
                    if let Some(cmd) = info.install_command {
                        println!("    Install: {}", cmd.yellow());
                    }
                }
            }
            Err(e) => println!("  {} {} check failed: {}", "✗".red(), name, e),
        }
    }

    println!();
    if runtime_mgr.all_compatible() {
        println!("{}", "✅ All checks passed!".green().bold());
    } else {
        println!("{}", "⚠️  Some checks failed".yellow().bold());
    }

    Ok(())
}

async fn cmd_logs(service: Option<String>, follow: bool, tail: usize) -> Result<()> {
    let service_name = match service {
        Some(s) => s,
        None => {
            println!("{}", "Error: Service name is required".red());
            println!("Usage: zero logs <service> [--follow] [--tail <lines>]");
            return Ok(());
        }
    };

    let config = match ZeroConfig::discover()? {
        Some(cfg) => cfg,
        None => {
            println!("{}", "Error: No zero.yml found".red());
            return Ok(());
        }
    };

    let project_name = config.metadata.name
        .clone()
        .unwrap_or_else(|| "zeroconfig-project".to_string());

    println!("{}", format!("📜 Viewing logs for service: {}", service_name).cyan().bold());

    let engine = Engine::new(project_name, config).await?;
    engine.get_logs(&service_name, follow, tail).await?;

    Ok(())
}

async fn cmd_cloud(action: CloudCommands) -> Result<()> {
    match action {
        CloudCommands::Start { provider } => {
            println!("Starting {} cloud emulation...", provider);
            // TODO: Implement cloud start
        }
        CloudCommands::Stop => {
            println!("Stopping cloud emulation...");
            // TODO: Implement cloud stop
        }
        CloudCommands::Status => {
            println!("Cloud emulation status:");
            // TODO: Implement cloud status
        }
        CloudCommands::Ui => {
            println!("Opening cloud UI...");
            // TODO: Implement cloud UI
        }
    }
    Ok(())
}

async fn cmd_shell(service: String, shell: String) -> Result<()> {
    let config = match ZeroConfig::discover()? {
        Some(cfg) => cfg,
        None => {
            println!("{}", "Error: No zero.yml found".red());
            return Ok(());
        }
    };

    let project_name = config.metadata.name
        .clone()
        .unwrap_or_else(|| "zeroconfig-project".to_string());

    println!("{}", format!("🐚 Opening {} shell in service: {}", shell, service).cyan().bold());

    let engine = Engine::new(project_name, config).await?;
    engine.open_shell(&service, &shell).await?;

    Ok(())
}

async fn cmd_exec(service: String, command: Vec<String>) -> Result<()> {
    let config = match ZeroConfig::discover()? {
        Some(cfg) => cfg,
        None => {
            println!("{}", "Error: No zero.yml found".red());
            return Ok(());
        }
    };

    let project_name = config.metadata.name
        .clone()
        .unwrap_or_else(|| "zeroconfig-project".to_string());

    println!("{}", format!("⚡ Executing command in service: {}", service).cyan().bold());
    println!("Command: {}", command.join(" "));

    let engine = Engine::new(project_name, config).await?;
    engine.exec_command(&service, command).await?;

    Ok(())
}

async fn cmd_monitor(interval: u64) -> Result<()> {
    println!("Monitoring resources (interval: {}s)...", interval);
    // TODO: Implement resource monitoring
    Ok(())
}

async fn cmd_ps() -> Result<()> {
    println!("{}", "📦 Running services:".cyan().bold());

    let config = match ZeroConfig::discover()? {
        Some(cfg) => cfg,
        None => {
            println!("No configuration found");
            return Ok(());
        }
    };

    let project_name = config.metadata.name
        .clone()
        .unwrap_or_else(|| "zeroconfig-project".to_string());

    let engine = Engine::new(project_name, config).await?;
    let containers = engine.list_services().await?;

    if containers.is_empty() {
        println!("No services running");
    } else {
        for container in containers {
            let name = container.names.and_then(|n| n.first().cloned()).unwrap_or_default();
            let status = container.status.unwrap_or_default();
            println!("  {} - {}", name.green(), status);
        }
    }

    Ok(())
}

async fn cmd_restart(services: Vec<String>) -> Result<()> {
    let config = match ZeroConfig::discover()? {
        Some(cfg) => cfg,
        None => {
            println!("{}", "Error: No zero.yml found".red());
            return Ok(());
        }
    };

    let project_name = config.metadata.name
        .clone()
        .unwrap_or_else(|| "zeroconfig-project".to_string());

    let engine = Engine::new(project_name, config).await?;

    if services.is_empty() {
        println!("{}", "🔄 Restarting all services...".cyan().bold());
        engine.restart_all().await?;
        println!("{}", "✅ All services restarted successfully".green());
    } else {
        println!("{}", format!("🔄 Restarting services: {}", services.join(", ")).cyan().bold());
        for service in services {
            engine.restart_service(&service).await?;
            println!("{}", format!("✅ Service {} restarted", service).green());
        }
    }

    Ok(())
}

async fn cmd_env(format: String) -> Result<()> {
    println!("Environment variables (format: {}):", format);
    // TODO: Implement env export
    Ok(())
}

async fn cmd_generate(target: GenerateCommands) -> Result<()> {
    match target {
        GenerateCommands::Dockerfile => {
            println!("Generating Dockerfile...");
            // TODO: Implement Dockerfile generation
        }
        GenerateCommands::Compose => {
            println!("Generating docker-compose.yml...");
            // TODO: Implement compose file generation
        }
        GenerateCommands::Env => {
            println!("Generating .env file...");
            // TODO: Implement env file generation
        }
        GenerateCommands::GithubActions => {
            println!("Generating GitHub Actions workflow...");
            // TODO: Implement workflow generation
        }
        GenerateCommands::All => {
            println!("Generating all configuration files...");
            // TODO: Implement all generation
        }
    }
    Ok(())
}

fn generate_template(template: Option<&str>) -> String {
    match template {
        Some("node") => include_str!("../templates/node.yml"),
        Some("python") => include_str!("../templates/python.yml"),
        Some("rust") => include_str!("../templates/rust.yml"),
        Some("go") => include_str!("../templates/go.yml"),
        Some("fullstack") => include_str!("../templates/fullstack.yml"),
        _ => include_str!("../templates/default.yml"),
    }.to_string()
}
