use anyhow::{Context, Result};
use bollard::Docker;
use bollard::container::{Config, CreateContainerOptions, StartContainerOptions, StopContainerOptions};
use bollard::image::CreateImageOptions;
use bollard::models::{ContainerSummary, HostConfig, PortBinding};
use futures::StreamExt;
use std::collections::HashMap;
use tracing::{info, warn, error};

pub mod docker_client;
pub mod service_templates;

use crate::config::{ServiceConfig, ZeroConfig};

/// Container orchestrator that manages Docker containers for services
pub struct ContainerOrchestrator {
    docker: Docker,
    project_name: String,
    network_name: String,
}

impl ContainerOrchestrator {
    /// Create a new container orchestrator
    pub async fn new(project_name: String) -> Result<Self> {
        let docker = Docker::connect_with_local_defaults()
            .context("Failed to connect to Docker")?;

        // Verify Docker is running
        docker.ping().await
            .context("Docker is not running or not accessible")?;

        let network_name = format!("zeroconfig_{}", project_name);

        Ok(Self {
            docker,
            project_name,
            network_name,
        })
    }

    /// Create Docker network for the project
    pub async fn create_network(&self) -> Result<()> {
        use bollard::network::CreateNetworkOptions;

        let config = CreateNetworkOptions {
            name: self.network_name.clone(),
            check_duplicate: true,
            driver: "bridge".to_string(),
            ..Default::default()
        };

        match self.docker.create_network(config).await {
            Ok(_) => {
                info!("Created network: {}", self.network_name);
                Ok(())
            }
            Err(e) if e.to_string().contains("already exists") => {
                info!("Network {} already exists", self.network_name);
                Ok(())
            }
            Err(e) => Err(e).context("Failed to create Docker network"),
        }
    }

    /// Pull Docker image if not present
    pub async fn pull_image(&self, image: &str) -> Result<()> {
        info!("Pulling image: {}", image);

        let options = Some(CreateImageOptions {
            from_image: image,
            ..Default::default()
        });

        let mut stream = self.docker.create_image(options, None, None);

        while let Some(result) = stream.next().await {
            match result {
                Ok(info) => {
                    if let Some(status) = info.status {
                        if status.contains("Download") || status.contains("Pull") {
                            info!("{}", status);
                        }
                    }
                }
                Err(e) => {
                    error!("Error pulling image: {}", e);
                    return Err(e).context("Failed to pull Docker image");
                }
            }
        }

        Ok(())
    }

    /// Create and start a service container
    pub async fn start_service(
        &self,
        service_name: &str,
        config: &ServiceConfig,
        port: u16,
    ) -> Result<String> {
        let container_name = format!("{}_{}", self.project_name, service_name);
        let image = self.get_service_image(service_name, &config.version);

        // Pull image first
        self.pull_image(&image).await?;

        // Prepare port bindings
        let mut port_bindings = HashMap::new();
        let container_port = self.get_default_port(service_name);

        port_bindings.insert(
            format!("{}/tcp", container_port),
            Some(vec![PortBinding {
                host_ip: Some("0.0.0.0".to_string()),
                host_port: Some(port.to_string()),
            }]),
        );

        // Prepare environment variables
        let mut env_vars: Vec<String> = config
            .environment
            .iter()
            .map(|(k, v)| format!("{}={}", k, v))
            .collect();

        // Add service-specific environment variables
        env_vars.extend(self.get_service_env_vars(service_name));

        // Prepare volumes
        let volumes: Vec<String> = config.volumes.clone();

        // Create container configuration
        let host_config = HostConfig {
            port_bindings: Some(port_bindings),
            network_mode: Some(self.network_name.clone()),
            binds: if volumes.is_empty() {
                None
            } else {
                Some(volumes)
            },
            ..Default::default()
        };

        let container_config = Config {
            image: Some(image.clone()),
            env: Some(env_vars),
            host_config: Some(host_config),
            cmd: config.command.as_ref().map(|c| vec![c.as_str()]),
            ..Default::default()
        };

        // Remove existing container if present
        let _ = self.remove_container(&container_name).await;

        // Create container
        let options = CreateContainerOptions {
            name: container_name.clone(),
            platform: None,
        };

        let container = self
            .docker
            .create_container(Some(options), container_config)
            .await
            .context("Failed to create container")?;

        // Start container
        self.docker
            .start_container(&container_name, None::<StartContainerOptions<String>>)
            .await
            .context("Failed to start container")?;

        info!(
            "Started container {} for service {} on port {}",
            container_name, service_name, port
        );

        Ok(container.id)
    }

    /// Stop a service container
    pub async fn stop_service(&self, service_name: &str) -> Result<()> {
        let container_name = format!("{}_{}", self.project_name, service_name);

        let options = Some(StopContainerOptions { t: 10 });

        match self.docker.stop_container(&container_name, options).await {
            Ok(_) => {
                info!("Stopped container: {}", container_name);
                Ok(())
            }
            Err(e) if e.to_string().contains("No such container") => {
                warn!("Container {} not found", container_name);
                Ok(())
            }
            Err(e) => Err(e).context("Failed to stop container"),
        }
    }

    /// Remove a container
    async fn remove_container(&self, container_name: &str) -> Result<()> {
        use bollard::container::RemoveContainerOptions;

        let options = Some(RemoveContainerOptions {
            force: true,
            ..Default::default()
        });

        match self.docker.remove_container(container_name, options).await {
            Ok(_) => Ok(()),
            Err(e) if e.to_string().contains("No such container") => Ok(()),
            Err(e) => Err(e).context("Failed to remove container"),
        }
    }

    /// List all running containers for this project
    pub async fn list_containers(&self) -> Result<Vec<ContainerSummary>> {
        use bollard::container::ListContainersOptions;

        let filters = HashMap::from([
            ("name".to_string(), vec![self.project_name.clone()]),
        ]);

        let options = Some(ListContainersOptions {
            all: true,
            filters,
            ..Default::default()
        });

        self.docker
            .list_containers(options)
            .await
            .context("Failed to list containers")
    }

    /// Get Docker image for a service
    fn get_service_image(&self, service_name: &str, version: &str) -> String {
        match service_name {
            "postgres" => format!("postgres:{}", version),
            "redis" => format!("redis:{}", version),
            "mongodb" | "mongo" => format!("mongo:{}", version),
            "mysql" => format!("mysql:{}", version),
            "kafka" => format!("confluentinc/cp-kafka:{}", version),
            "rabbitmq" => format!("rabbitmq:{}-management", version),
            "elasticsearch" => format!("elasticsearch:{}", version),
            "minio" => format!("minio/minio:{}", version),
            "localstack" => format!("localstack/localstack:{}", version),
            _ => format!("{}:{}", service_name, version),
        }
    }

    /// Get default port for a service
    fn get_default_port(&self, service_name: &str) -> u16 {
        match service_name {
            "postgres" => 5432,
            "redis" => 6379,
            "mongodb" | "mongo" => 27017,
            "mysql" => 3306,
            "kafka" => 9092,
            "rabbitmq" => 5672,
            "elasticsearch" => 9200,
            "minio" => 9000,
            "localstack" => 4566,
            _ => 8080,
        }
    }

    /// Get service-specific environment variables
    fn get_service_env_vars(&self, service_name: &str) -> Vec<String> {
        match service_name {
            "postgres" => vec![
                "POSTGRES_PASSWORD=zeroconfig".to_string(),
                "POSTGRES_USER=zeroconfig".to_string(),
                "POSTGRES_DB=zeroconfig".to_string(),
            ],
            "mysql" => vec![
                "MYSQL_ROOT_PASSWORD=zeroconfig".to_string(),
                "MYSQL_DATABASE=zeroconfig".to_string(),
            ],
            "mongodb" | "mongo" => vec![
                "MONGO_INITDB_ROOT_USERNAME=zeroconfig".to_string(),
                "MONGO_INITDB_ROOT_PASSWORD=zeroconfig".to_string(),
            ],
            "rabbitmq" => vec![
                "RABBITMQ_DEFAULT_USER=zeroconfig".to_string(),
                "RABBITMQ_DEFAULT_PASS=zeroconfig".to_string(),
            ],
            _ => vec![],
        }
    }

    /// Stop all project containers
    pub async fn stop_all(&self) -> Result<()> {
        let containers = self.list_containers().await?;

        for container in containers {
            if let Some(names) = container.names {
                if let Some(name) = names.first() {
                    let service_name = name.trim_start_matches('/');
                    if service_name.starts_with(&self.project_name) {
                        self.stop_service(service_name).await?;
                    }
                }
            }
        }

        Ok(())
    }
}
