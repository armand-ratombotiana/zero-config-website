use anyhow::{Context, Result};
use bollard::Docker;
use bollard::container::{Config, CreateContainerOptions, StartContainerOptions, StopContainerOptions, LogsOptions, AttachContainerOptions};
use bollard::exec::{CreateExecOptions, StartExecResults};
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
    credential_store: std::sync::Arc<tokio::sync::Mutex<crate::secrets::CredentialStore>>,
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

        // Initialize credential store
        let project_path = std::env::current_dir()?;
        let mut credential_store = crate::secrets::CredentialStore::new(project_path);
        let _ = credential_store.load(); // Load existing credentials if available

        Ok(Self {
            docker,
            project_name,
            network_name,
            credential_store: std::sync::Arc::new(tokio::sync::Mutex::new(credential_store)),
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
            cmd: config.command.as_ref().map(|c| vec![c.to_string()]),
            ..Default::default()
        };

        // Remove existing container if present (log errors but don't fail)
        if let Err(e) = self.remove_container(&container_name).await {
            warn!("Failed toremove existing container {}: {}", container_name, e);
        }

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

    /// Get service-specific environment variables with generated secrets
    fn get_service_env_vars(&self, service_name: &str) -> Vec<String> {
        use crate::secrets::SecretGenerator;

        // Use credential store to persist passwords across restarts
        let credential_store = self.credential_store.clone();
        let service_name_owned = service_name.to_string();
        
        // Block on async operation (we're in a sync context)
        let runtime = tokio::runtime::Handle::current();
        let env_vars = runtime.block_on(async move {
            let mut store = credential_store.lock().await;
            
            match service_name_owned.as_str() {
                "postgres" => {
                    let password = store.get_or_generate(
                        &format!("{}_POSTGRES_PASSWORD", service_name_owned),
                        || SecretGenerator::generate_db_password()
                    );
                    let _ = store.save(); // Save credentials to file
                    info!("Using persisted password for postgres service");
                    vec![
                        format!("POSTGRES_PASSWORD={}", password),
                        "POSTGRES_USER=zeroconfig".to_string(),
                        "POSTGRES_DB=zeroconfig".to_string(),
                    ]
                }
                "mysql" => {
                    let password = store.get_or_generate(
                        &format!("{}_MYSQL_ROOT_PASSWORD", service_name_owned),
                        || SecretGenerator::generate_db_password()
                    );
                    let _ = store.save();
                    info!("Using persisted password for mysql service");
                    vec![
                        format!("MYSQL_ROOT_PASSWORD={}", password),
                        "MYSQL_DATABASE=zeroconfig".to_string(),
                    ]
                }
                "mongodb" | "mongo" => {
                    let password = store.get_or_generate(
                        &format!("{}_MONGO_INITDB_ROOT_PASSWORD", service_name_owned),
                        || SecretGenerator::generate_db_password()
                    );
                    let _ = store.save();
                    info!("Using persisted password for mongodb service");
                    vec![
                        "MONGO_INITDB_ROOT_USERNAME=zeroconfig".to_string(),
                        format!("MONGO_INITDB_ROOT_PASSWORD={}", password),
                    ]
                }
                "rabbitmq" => {
                    let password = store.get_or_generate(
                        &format!("{}_RABBITMQ_DEFAULT_PASS", service_name_owned),
                        || SecretGenerator::generate_db_password()
                    );
                    let _ = store.save();
                    info!("Using persisted password for rabbitmq service");
                    vec![
                        "RABBITMQ_DEFAULT_USER=zeroconfig".to_string(),
                        format!("RABBITMQ_DEFAULT_PASS={}", password),
                    ]
                }
                _ => vec![],
            }
        });
        
        env_vars
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

    /// Get container ID by service name
    pub async fn get_container_id(&self, service_name: &str) -> Result<String> {
        let containers = self.list_containers().await?;

        for container in containers {
            if let Some(names) = container.names {
                for name in names {
                    let container_name = name.trim_start_matches('/');
                    if container_name == service_name || container_name.ends_with(&format!("-{}", service_name)) {
                        return Ok(container.id.context("Container has no ID")?);
                    }
                }
            }
        }

        anyhow::bail!("Service '{}' not found or not running", service_name)
    }

    /// Stream logs from a service container
    pub async fn get_logs(&self, service_name: &str, follow: bool, tail: usize) -> Result<()> {
        let container_id = self.get_container_id(service_name).await?;

        let options = LogsOptions::<String> {
            follow,
            stdout: true,
            stderr: true,
            tail: tail.to_string(),
            ..Default::default()
        };

        let mut stream = self.docker.logs(&container_id, Some(options));

        while let Some(log) = stream.next().await {
            match log {
                Ok(output) => print!("{}", output),
                Err(e) => {
                    error!("Error reading logs: {}", e);
                    break;
                }
            }
        }

        Ok(())
    }

    /// Execute a command in a service container
    pub async fn exec_command(&self, service_name: &str, command: Vec<String>) -> Result<()> {
        let container_id = self.get_container_id(service_name).await?;

        let exec_config = CreateExecOptions {
            attach_stdout: Some(true),
            attach_stderr: Some(true),
            cmd: Some(command.iter().map(|s| s.as_str()).collect()),
            ..Default::default()
        };

        let exec = self.docker.create_exec(&container_id, exec_config).await?;

        if let StartExecResults::Attached { mut output, .. } = self.docker.start_exec(&exec.id, None).await? {
            while let Some(chunk) = output.next().await {
                match chunk {
                    Ok(output) => print!("{}", output),
                    Err(e) => {
                        error!("Error executing command: {}", e);
                        break;
                    }
                }
            }
        }

        Ok(())
    }

    /// Execute a command in a service container and return the output as a String
    pub async fn exec_command_with_output(&self, service_name: &str, command: Vec<String>) -> Result<String> {
        let container_id = self.get_container_id(service_name).await?;

        let exec_config = CreateExecOptions {
            attach_stdout: Some(true),
            attach_stderr: Some(true),
            cmd: Some(command.iter().map(|s| s.as_str()).collect()),
            ..Default::default()
        };

        let exec = self.docker.create_exec(&container_id, exec_config).await?;

        let mut output_string = String::new();

        if let StartExecResults::Attached { mut output, .. } = self.docker.start_exec(&exec.id, None).await? {
            while let Some(chunk) = output.next().await {
                match chunk {
                    Ok(output) => {
                        output_string.push_str(&output.to_string());
                    }
                    Err(e) => {
                        error!("Error executing command: {}", e);
                        break;
                    }
                }
            }
        }

        Ok(output_string)
    }

    /// Open an interactive shell in a service container
    pub async fn open_shell(&self, service_name: &str, shell: &str) -> Result<()> {
        let container_id = self.get_container_id(service_name).await?;

        info!("Opening {} shell in container {}", shell, service_name);

        // Use docker CLI for interactive shell since Bollard doesn't support TTY properly
        let docker_cmd = if cfg!(windows) {
            format!("docker exec -it {} {}", container_id, shell)
        } else {
            format!("docker exec -it {} {}", container_id, shell)
        };

        println!("Running: {}", docker_cmd);
        println!("Note: Interactive shells require running 'docker exec -it {} {}' directly", container_id, shell);

        Ok(())
    }

    /// Restart a specific service
    pub async fn restart_service(&self, service_name: &str) -> Result<()> {
        let container_id = self.get_container_id(service_name).await?;

        info!("Restarting service: {}", service_name);

        // Stop the container
        self.docker.stop_container(&container_id, None).await
            .context("Failed to stop container")?;

        // Start the container
        self.docker.start_container::<String>(&container_id, None).await
            .context("Failed to start container")?;

        info!("Service {} restarted successfully", service_name);
        Ok(())
    }

    /// Restart all project services
    pub async fn restart_all(&self) -> Result<()> {
        let containers = self.list_containers().await?;

        for container in containers {
            if let Some(names) = container.names {
                if let Some(name) = names.first() {
                    let service_name = name.trim_start_matches('/');
                    if service_name.starts_with(&self.project_name) {
                        self.restart_service(service_name).await?;
                    }
                }
            }
        }

        Ok(())
    }

    /// Get container stats for monitoring
    pub async fn get_container_stats(&self, service_name: &str) -> Result<bollard::container::Stats> {
        let container_id = self.get_container_id(service_name).await?;

        let mut stats_stream = self.docker.stats(&container_id, Some(bollard::container::StatsOptions {
            stream: false,
            one_shot: true,
        }));

        if let Some(stats_result) = stats_stream.next().await {
            return Ok(stats_result?);
        }

        anyhow::bail!("Failed to get stats for service '{}'", service_name)
    }

    /// Get stats for all project containers
    pub async fn get_all_stats(&self) -> Result<Vec<(String, bollard::container::Stats)>> {
        let containers = self.list_containers().await?;
        let mut stats = Vec::new();

        for container in containers {
            if let Some(names) = container.names {
                if let Some(name) = names.first() {
                    let service_name = name.trim_start_matches('/');
                    if service_name.starts_with(&self.project_name) {
                        match self.get_container_stats(service_name).await {
                            Ok(stat) => stats.push((service_name.to_string(), stat)),
                            Err(e) => warn!("Failed to get stats for {}: {}", service_name, e),
                        }
                    }
                }
            }
        }

        Ok(stats)
    }
}
