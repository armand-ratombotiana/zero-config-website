mod cli;
mod config;
mod core;
mod orchestrator;
mod runtime;
mod services;
mod secrets;
mod generators;
mod cloud;
mod health;

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
        Commands::Health { service, wait, timeout } => {
            cmd_health(service, wait, timeout).await?;
        }
        Commands::Backup { service, output } => {
            cmd_backup(service, output).await?;
        }
        Commands::Restore { service, file } => {
            cmd_restore(service, file).await?;
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
            println!("{}", format!("☁️  Starting {} cloud emulation...", provider).cyan().bold());

            let emulator = cloud::CloudEmulator::new(provider.clone()).await?;
            emulator.start().await?;

            println!("{}", format!("✅ {} emulation started successfully", provider).green());

            // Show provider-specific configuration
            match provider.as_str() {
                "localstack" | "aws" => println!("\n{}", cloud::localstack::get_aws_config_snippet()),
                "azure" | "azurite" => println!("\n{}", cloud::azurite::get_azure_config_snippet()),
                "gcp" | "google" => println!("\n{}", cloud::gcp::get_gcp_config_snippet()),
                _ => {}
            }
        }
        CloudCommands::Stop => {
            println!("{}", "☁️  Stopping cloud emulation...".cyan().bold());

            // Stop all known emulators
            for provider in &["localstack", "azurite", "gcp"] {
                let emulator = cloud::CloudEmulator::new(provider.to_string()).await?;
                let _ = emulator.stop().await;
            }

            println!("{}", "✅ Cloud emulation stopped".green());
        }
        CloudCommands::Status => {
            println!("{}", "☁️  Cloud emulation status:".cyan().bold());
            println!();

            // Check status of all emulators
            for provider in &["localstack", "azurite", "gcp"] {
                let emulator = cloud::CloudEmulator::new(provider.to_string()).await?;
                let _ = emulator.status().await;
                println!();
            }
        }
        CloudCommands::Ui => {
            println!("{}", "☁️  Opening cloud UI...".cyan().bold());

            // Default to LocalStack, but can be extended
            let emulator = cloud::CloudEmulator::new("localstack".to_string()).await?;
            emulator.ui().await?;
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

    println!("{}", format!("📊 Monitoring resources (interval: {}s)", interval).cyan().bold());
    println!("{}", "Press Ctrl+C to stop".yellow());
    println!();

    let engine = Engine::new(project_name, config).await?;

    loop {
        match engine.get_all_stats().await {
            Ok(stats) => {
                // Clear screen (platform independent)
                print!("\x1B[2J\x1B[1;1H");

                println!("{}", "📊 Container Resource Usage".cyan().bold());
                println!("{}", "─".repeat(80));
                println!("{:25} {:>12} {:>12} {:>12} {:>12}",
                    "SERVICE", "CPU %", "MEMORY", "NET I/O", "BLOCK I/O");
                println!("{}", "─".repeat(80));

                for (service_name, stat) in stats {
                    let cpu_percent = calculate_cpu_percent(&stat);
                    let memory_usage = format_bytes(stat.memory_stats.usage.unwrap_or(0));
                    let net_rx = format_bytes(
                        stat.networks.as_ref()
                            .and_then(|n| n.values().next())
                            .map(|n| n.rx_bytes)
                            .unwrap_or(0)
                    );
                    let net_tx = format_bytes(
                        stat.networks.as_ref()
                            .and_then(|n| n.values().next())
                            .map(|n| n.tx_bytes)
                            .unwrap_or(0)
                    );
                    let block_read = format_bytes(
                        stat.blkio_stats.io_service_bytes_recursive.as_ref()
                            .and_then(|io| io.first())
                            .map(|io| io.value)
                            .unwrap_or(0)
                    );

                    println!("{:25} {:>11.2}% {:>12} {:>12} {:>12}",
                        service_name.green(),
                        cpu_percent,
                        memory_usage,
                        format!("{}/{}", net_rx, net_tx),
                        block_read
                    );
                }

                println!("{}", "─".repeat(80));
                println!("\n{}", format!("Updated: {}", chrono::Local::now().format("%Y-%m-%d %H:%M:%S")).dimmed());
            },
            Err(e) => {
                println!("{}", format!("Error fetching stats: {}", e).red());
            }
        }

        tokio::time::sleep(tokio::time::Duration::from_secs(interval)).await;
    }
}

fn calculate_cpu_percent(stats: &bollard::container::Stats) -> f64 {
    let cpu_delta = stats.cpu_stats.cpu_usage.total_usage as f64
        - stats.precpu_stats.cpu_usage.total_usage as f64;
    let system_delta = stats.cpu_stats.system_cpu_usage.unwrap_or(0) as f64
        - stats.precpu_stats.system_cpu_usage.unwrap_or(0) as f64;

    if system_delta > 0.0 && cpu_delta > 0.0 {
        let num_cpus = stats.cpu_stats.online_cpus.unwrap_or(1) as f64;
        (cpu_delta / system_delta) * num_cpus * 100.0
    } else {
        0.0
    }
}

fn format_bytes(bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    let mut size = bytes as f64;
    let mut unit_index = 0;

    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }

    format!("{:.2} {}", size, UNITS[unit_index])
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
    let config = match ZeroConfig::discover()? {
        Some(cfg) => cfg,
        None => {
            println!("{}", "Error: No zero.yml found".red());
            return Ok(());
        }
    };

    println!("{}", format!("🔐 Environment variables (format: {})", format).cyan().bold());

    let mut env_manager = secrets::EnvManager::new();
    env_manager.process_env_vars(&config.env);

    match format.as_str() {
        "shell" | "bash" => {
            println!("{}", env_manager.export_shell());
        }
        "dotenv" | "env" => {
            println!("{}", env_manager.export_dotenv());
        }
        "json" => {
            let json = env_manager.export_json()?;
            println!("{}", json);
        }
        "yaml" | "yml" => {
            let yaml = env_manager.export_yaml()?;
            println!("{}", yaml);
        }
        _ => {
            println!("{}", "Unknown format. Supported: shell, dotenv, json, yaml".yellow());
            println!("\nAvailable formats:");
            println!("  shell   - Export statements (export KEY=value)");
            println!("  dotenv  - .env file format (KEY=value)");
            println!("  json    - JSON object");
            println!("  yaml    - YAML format");
        }
    }

    Ok(())
}

async fn cmd_generate(target: GenerateCommands) -> Result<()> {
    let config = match ZeroConfig::discover()? {
        Some(cfg) => cfg,
        None => {
            println!("{}", "Error: No zero.yml found".red());
            return Ok(());
        }
    };

    let output_dir = std::env::current_dir()?;

    match target {
        GenerateCommands::Dockerfile => {
            println!("{}", "📄 Generating Dockerfile...".cyan().bold());
            generators::dockerfile::generate(&config, &output_dir)?;
        }
        GenerateCommands::Compose => {
            println!("{}", "📄 Generating docker-compose.yml...".cyan().bold());
            generators::compose::generate(&config, &output_dir)?;
        }
        GenerateCommands::Env => {
            println!("{}", "📄 Generating .env file...".cyan().bold());
            generators::envfile::generate(&config, &output_dir)?;
        }
        GenerateCommands::GithubActions => {
            println!("{}", "📄 Generating GitHub Actions workflow...".cyan().bold());
            generators::github_actions::generate(&config, &output_dir)?;
        }
        GenerateCommands::All => {
            println!("{}", "📄 Generating all configuration files...".cyan().bold());
            generators::generate_all(&config, &output_dir)?;
        }
    }

    println!("{}", "✅ Generation complete!".green().bold());
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

async fn cmd_health(service: Option<String>, wait: bool, timeout: u64) -> Result<()> {
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

    println!("{}", "💚 Health Check".cyan().bold());
    println!("{}", "─".repeat(80));

    let engine = Engine::new(project_name.clone(), config).await?;
    let health_checker = health::HealthChecker::new().await?;

    if let Some(service_name) = service {
        // Check specific service
        let containers = engine.list_services().await?;

        for container in containers {
            if let Some(names) = container.names {
                for name in names {
                    let container_name = name.trim_start_matches('/');
                    if container_name.contains(&service_name) {
                        let container_id = container.id.as_deref().unwrap_or("");

                        if wait {
                            println!("Waiting for {} to become healthy (timeout: {}s)...", service_name, timeout);
                            match health_checker.wait_for_healthy(
                                container_id,
                                &service_name,
                                std::time::Duration::from_secs(timeout),
                            ).await {
                                Ok(status) => {
                                    println!("{}", health::format_health_status(&status));
                                    println!("{}", "✅ Service is healthy!".green().bold());
                                }
                                Err(e) => {
                                    println!("{}", format!("❌ Health check failed: {}", e).red().bold());
                                    return Ok(());
                                }
                            }
                        } else {
                            let status = health_checker.check_container(container_id, &service_name).await?;
                            println!("{}", health::format_health_status(&status));
                        }

                        return Ok(());
                    }
                }
            }
        }

        println!("{}", format!("Service '{}' not found", service_name).yellow());
    } else {
        // Check all services
        let containers = engine.list_services().await?;

        for container in containers {
            if let Some(names) = container.names {
                if let Some(name) = names.first() {
                    let container_name = name.trim_start_matches('/');
                    if container_name.starts_with(&project_name) {
                        let container_id = container.id.as_deref().unwrap_or("");
                        let status = health_checker.check_container(container_id, container_name).await?;
                        println!("{}", health::format_health_status(&status));
                    }
                }
            }
        }

        println!("{}", "─".repeat(80));
    }

    Ok(())
}

async fn cmd_backup(service: String, output: String) -> Result<()> {
    println!("{}", format!("💾 Backing up service: {}", service).cyan().bold());

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

    // Create backup directory
    std::fs::create_dir_all(&output)?;

    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let backup_file = format!("{}/{}_{}.sql", output, service, timestamp);

    // Execute backup command based on service type
    let backup_command = if service.contains("postgres") {
        vec![
            "pg_dump".to_string(),
            "-U".to_string(),
            "postgres".to_string(),
            "-d".to_string(),
            "postgres".to_string(),
        ]
    } else if service.contains("mysql") {
        vec![
            "mysqldump".to_string(),
            "-u".to_string(),
            "root".to_string(),
            "--all-databases".to_string(),
        ]
    } else if service.contains("mongo") {
        vec![
            "mongodump".to_string(),
            "--archive".to_string(),
        ]
    } else {
        println!("{}", format!("Backup not supported for service type: {}", service).yellow());
        return Ok(());
    };

    println!("Executing backup command...");
    engine.exec_command(&service, backup_command).await?;

    println!("{}", format!("✅ Backup saved to: {}", backup_file).green());
    println!("\nTo restore this backup, run:");
    println!("  {}", format!("zero restore {} --file {}", service, backup_file).cyan());

    Ok(())
}

async fn cmd_restore(service: String, file: String) -> Result<()> {
    println!("{}", format!("♻️  Restoring service: {}", service).cyan().bold());
    println!("{}", format!("From file: {}", file).dimmed());

    if !std::path::Path::new(&file).exists() {
        println!("{}", format!("Error: Backup file not found: {}", file).red());
        return Ok(());
    }

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

    // Execute restore command based on service type
    let restore_command = if service.contains("postgres") {
        vec![
            "psql".to_string(),
            "-U".to_string(),
            "postgres".to_string(),
            "-f".to_string(),
            file,
        ]
    } else if service.contains("mysql") {
        vec![
            "mysql".to_string(),
            "-u".to_string(),
            "root".to_string(),
            format!("< {}", file),
        ]
    } else if service.contains("mongo") {
        vec![
            "mongorestore".to_string(),
            "--archive={}".to_string(),
            file,
        ]
    } else {
        println!("{}", format!("Restore not supported for service type: {}", service).yellow());
        return Ok(());
    };

    println!("Executing restore command...");
    engine.exec_command(&service, restore_command).await?;

    println!("{}", "✅ Restore completed successfully".green());

    Ok(())
}
