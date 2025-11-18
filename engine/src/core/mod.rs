use anyhow::Result;
use bollard::models::ContainerSummary;
use tracing::{info, warn};

use crate::config::ZeroConfig;
use crate::orchestrator::ContainerOrchestrator;

/// Main ZeroConfig engine that orchestrates the environment
pub struct Engine {
    project_name: String,
    config: ZeroConfig,
    orchestrator: ContainerOrchestrator,
    allocated_ports: std::collections::HashMap<String, u16>,
}

impl Engine {
    pub async fn new(project_name: String, config: ZeroConfig) -> Result<Self> {
        info!("Initializing ZeroConfig engine for project: {}", project_name);

        let orchestrator = ContainerOrchestrator::new(project_name.clone()).await?;

        Ok(Self {
            project_name,
            config,
            orchestrator,
            allocated_ports: std::collections::HashMap::new(),
        })
    }

    pub async fn build(&mut self) -> Result<()> {
        info!("Building environment...");

        // Create network
        self.orchestrator.create_network().await?;

        // Allocate ports for services
        self.allocate_ports()?;

        info!("Environment built successfully");
        Ok(())
    }

    pub async fn start(&mut self) -> Result<()> {
        info!("Starting services...");

        for (service_name, service_config) in self.config.get_services() {
            let port = self.allocated_ports.get(&service_name).copied().unwrap_or(8080);

            info!("Starting service: {} on port {}", service_name, port);

            self.orchestrator
                .start_service(&service_name, &service_config, port)
                .await?;
        }

        info!("All services started");
        Ok(())
    }

    pub async fn stop(&self) -> Result<()> {
        info!("Stopping all services...");
        self.orchestrator.stop_all().await?;
        Ok(())
    }

    pub async fn list_services(&self) -> Result<Vec<ContainerSummary>> {
        self.orchestrator.list_containers().await
    }

    pub async fn get_logs(&self, service: &str, follow: bool, tail: usize) -> Result<()> {
        self.orchestrator.get_logs(service, follow, tail).await
    }

    pub async fn exec_command(&self, service: &str, command: Vec<String>) -> Result<()> {
        self.orchestrator.exec_command(service, command).await
    }

    pub async fn open_shell(&self, service: &str, shell: &str) -> Result<()> {
        self.orchestrator.open_shell(service, shell).await
    }

    pub async fn restart_service(&self, service: &str) -> Result<()> {
        self.orchestrator.restart_service(service).await
    }

    pub async fn restart_all(&self) -> Result<()> {
        self.orchestrator.restart_all().await
    }

    pub async fn get_container_stats(&self, service: &str) -> Result<bollard::container::Stats> {
        self.orchestrator.get_container_stats(service).await
    }

    pub async fn get_all_stats(&self) -> Result<Vec<(String, bollard::container::Stats)>> {
        self.orchestrator.get_all_stats().await
    }

    fn allocate_ports(&mut self) -> Result<()> {
        let mut port = 5000;

        for (service_name, _) in self.config.get_services() {
            self.allocated_ports.insert(service_name, port);
            port += 1;
        }

        Ok(())
    }
}
