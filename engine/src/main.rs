use anyhow::{Context, Result};
use colored::Colorize;
use zeroconfig::cli::{Cli, Commands};
use zeroconfig::commands;
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
            commands::init(name, template).await?;
        }
        Commands::Up { build, detach } => {
            commands::up(build, detach).await?;
        }
        Commands::Down { volumes } => {
            commands::down(volumes).await?;
        }
        Commands::Start { service } => {
            commands::start_service(service).await?;
        }
        Commands::Stop { service } => {
            commands::stop_service(service).await?;
        }
        Commands::BuildEnv => {
            commands::build_env().await?;
        }
        Commands::Doctor => {
            commands::doctor().await?;
        }
        Commands::Logs { service, follow, tail } => {
            commands::logs(service, follow, tail).await?;
        }
        Commands::Cloud { action } => {
            commands::cloud(action).await?;
        }
        Commands::Shell { service, shell } => {
            commands::shell(service, shell).await?;
        }
        Commands::Exec { service, command } => {
            commands::exec(service, command).await?;
        }
        Commands::Monitor { interval } => {
            commands::monitor(interval).await?;
        }
        Commands::Ps => {
            commands::ps().await?;
        }
        Commands::Restart { services } => {
            commands::restart(services).await?;
        }
        Commands::Env { format } => {
            commands::env(format).await?;
        }
        Commands::Generate { target } => {
            commands::generate(target).await?;
        }
        Commands::Health { service, wait, timeout } => {
            commands::health(service, wait, timeout).await?;
        }
        Commands::Backup { service, output } => {
            commands::backup(service, output).await?;
        }
        Commands::Restore { service, file } => {
            commands::restore(service, file).await?;
        }
    }

    Ok(())
}
