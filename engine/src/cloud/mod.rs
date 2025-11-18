use anyhow::{Context, Result};
use bollard::Docker;
use bollard::container::{Config, CreateContainerOptions, StartContainerOptions};
use bollard::image::CreateImageOptions;
use futures::StreamExt;
use tracing::{info, error};

pub mod localstack;
pub mod azurite;
pub mod gcp;

pub struct CloudEmulator {
    docker: Docker,
    provider: String,
}

impl CloudEmulator {
    pub async fn new(provider: String) -> Result<Self> {
        let docker = Docker::connect_with_local_defaults()
            .context("Failed to connect to Docker")?;

        docker.ping().await
            .context("Docker is not running or not accessible")?;

        Ok(Self { docker, provider })
    }

    pub async fn start(&self) -> Result<()> {
        match self.provider.as_str() {
            "localstack" | "aws" => self.start_localstack().await,
            "azure" | "azurite" => self.start_azurite().await,
            "gcp" | "google" => self.start_gcp_emulators().await,
            _ => anyhow::bail!("Unsupported cloud provider: {}. Supported: aws, azure, gcp", self.provider),
        }
    }

    async fn start_localstack(&self) -> Result<()> {
        info!("Starting LocalStack...");

        let image = "localstack/localstack:latest";

        // Pull image
        info!("Pulling image: {}", image);
        let mut stream = self.docker.create_image(
            Some(CreateImageOptions {
                from_image: image,
                ..Default::default()
            }),
            None,
            None,
        );

        while let Some(info) = stream.next().await {
            match info {
                Ok(_) => {},
                Err(e) => error!("Error pulling image: {}", e),
            }
        }

        // Create container
        let container_name = "zeroconfig-localstack";

        // Stop and remove existing container if it exists
        let _ = self.docker.stop_container(container_name, None).await;
        let _ = self.docker.remove_container(container_name, None).await;

        let config = Config {
            image: Some(image.to_string()),
            env: Some(vec![
                "SERVICES=s3,dynamodb,sqs,sns,lambda,apigateway,cloudformation".to_string(),
                "DEBUG=1".to_string(),
                "DATA_DIR=/tmp/localstack/data".to_string(),
            ]),
            exposed_ports: Some({
                let mut map = std::collections::HashMap::new();
                map.insert("4566/tcp".to_string(), std::collections::HashMap::new());
                map.insert("4571/tcp".to_string(), std::collections::HashMap::new());
                map
            }),
            host_config: Some(bollard::models::HostConfig {
                port_bindings: Some({
                    let mut map = std::collections::HashMap::new();
                    map.insert(
                        "4566/tcp".to_string(),
                        Some(vec![bollard::models::PortBinding {
                            host_ip: Some("0.0.0.0".to_string()),
                            host_port: Some("4566".to_string()),
                        }]),
                    );
                    map
                }),
                ..Default::default()
            }),
            ..Default::default()
        };

        self.docker
            .create_container(
                Some(CreateContainerOptions {
                    name: container_name,
                    ..Default::default()
                }),
                config,
            )
            .await?;

        // Start container
        self.docker
            .start_container(container_name, None::<StartContainerOptions<String>>)
            .await?;

        info!("LocalStack started successfully");
        println!("✅ LocalStack is running on http://localhost:4566");
        println!("   Available services: S3, DynamoDB, SQS, SNS, Lambda, API Gateway, CloudFormation");

        Ok(())
    }

    async fn start_azurite(&self) -> Result<()> {
        info!("Starting Azurite (Azure Storage Emulator)...");

        let image = azurite::DEFAULT_IMAGE;

        // Pull image
        info!("Pulling image: {}", image);
        let mut stream = self.docker.create_image(
            Some(CreateImageOptions {
                from_image: image,
                ..Default::default()
            }),
            None,
            None,
        );

        while let Some(info) = stream.next().await {
            match info {
                Ok(_) => {},
                Err(e) => error!("Error pulling image: {}", e),
            }
        }

        // Create container
        let container_name = "zeroconfig-azurite";

        // Stop and remove existing container if it exists
        let _ = self.docker.stop_container(container_name, None).await;
        let _ = self.docker.remove_container(container_name, None).await;

        let config = Config {
            image: Some(image.to_string()),
            exposed_ports: Some({
                let mut map = std::collections::HashMap::new();
                map.insert(format!("{}/tcp", azurite::BLOB_PORT), std::collections::HashMap::new());
                map.insert(format!("{}/tcp", azurite::QUEUE_PORT), std::collections::HashMap::new());
                map.insert(format!("{}/tcp", azurite::TABLE_PORT), std::collections::HashMap::new());
                map
            }),
            host_config: Some(bollard::models::HostConfig {
                port_bindings: Some({
                    let mut map = std::collections::HashMap::new();
                    for port in &[azurite::BLOB_PORT, azurite::QUEUE_PORT, azurite::TABLE_PORT] {
                        map.insert(
                            format!("{}/tcp", port),
                            Some(vec![bollard::models::PortBinding {
                                host_ip: Some("0.0.0.0".to_string()),
                                host_port: Some(port.to_string()),
                            }]),
                        );
                    }
                    map
                }),
                ..Default::default()
            }),
            ..Default::default()
        };

        self.docker
            .create_container(
                Some(CreateContainerOptions {
                    name: container_name,
                    ..Default::default()
                }),
                config,
            )
            .await?;

        // Start container
        self.docker
            .start_container(container_name, None::<StartContainerOptions<String>>)
            .await?;

        info!("Azurite started successfully");
        println!("✅ Azurite (Azure Storage Emulator) is running");
        println!("   Blob Storage: {}", azurite::get_blob_endpoint());
        println!("   Queue Storage: {}", azurite::get_queue_endpoint());
        println!("   Table Storage: {}", azurite::get_table_endpoint());

        Ok(())
    }

    async fn start_gcp_emulators(&self) -> Result<()> {
        info!("Starting GCP emulators...");

        // For GCP, we'll start individual emulators for each service
        // Starting with Firestore emulator
        let image = "gcr.io/google.com/cloudsdktool/google-cloud-cli:latest";

        // Pull image
        info!("Pulling image: {}", image);
        let mut stream = self.docker.create_image(
            Some(CreateImageOptions {
                from_image: image,
                ..Default::default()
            }),
            None,
            None,
        );

        while let Some(info) = stream.next().await {
            match info {
                Ok(_) => {},
                Err(e) => error!("Error pulling image: {}", e),
            }
        }

        // Create Firestore emulator container
        let container_name = "zeroconfig-gcp-firestore";

        // Stop and remove existing container if it exists
        let _ = self.docker.stop_container(container_name, None).await;
        let _ = self.docker.remove_container(container_name, None).await;

        let config = Config {
            image: Some(image.to_string()),
            cmd: Some(vec![
                "gcloud".to_string(),
                "emulators".to_string(),
                "firestore".to_string(),
                "start".to_string(),
                "--host-port=0.0.0.0:8080".to_string(),
            ]),
            exposed_ports: Some({
                let mut map = std::collections::HashMap::new();
                map.insert("8080/tcp".to_string(), std::collections::HashMap::new());
                map
            }),
            host_config: Some(bollard::models::HostConfig {
                port_bindings: Some({
                    let mut map = std::collections::HashMap::new();
                    map.insert(
                        "8080/tcp".to_string(),
                        Some(vec![bollard::models::PortBinding {
                            host_ip: Some("0.0.0.0".to_string()),
                            host_port: Some("8080".to_string()),
                        }]),
                    );
                    map
                }),
                ..Default::default()
            }),
            ..Default::default()
        };

        self.docker
            .create_container(
                Some(CreateContainerOptions {
                    name: container_name,
                    ..Default::default()
                }),
                config,
            )
            .await?;

        // Start container
        self.docker
            .start_container(container_name, None::<StartContainerOptions<String>>)
            .await?;

        info!("GCP emulators started successfully");
        println!("✅ GCP Firestore Emulator is running on {}", gcp::get_firestore_endpoint());
        println!("   Use FIRESTORE_EMULATOR_HOST environment variable");

        Ok(())
    }

    pub async fn stop(&self) -> Result<()> {
        info!("Stopping cloud emulation...");

        let container_names = match self.provider.as_str() {
            "localstack" | "aws" => vec!["zeroconfig-localstack"],
            "azure" | "azurite" => vec!["zeroconfig-azurite"],
            "gcp" | "google" => vec!["zeroconfig-gcp-firestore", "zeroconfig-gcp-pubsub"],
            _ => return Ok(()),
        };

        for container_name in container_names {
            let _ = self.docker.stop_container(container_name, None).await;
            let _ = self.docker.remove_container(container_name, None).await;
        }

        info!("Cloud emulation stopped");
        Ok(())
    }

    pub async fn status(&self) -> Result<()> {
        let (container_name, endpoint) = match self.provider.as_str() {
            "localstack" | "aws" => ("zeroconfig-localstack", "http://localhost:4566".to_string()),
            "azure" | "azurite" => ("zeroconfig-azurite", azurite::get_blob_endpoint()),
            "gcp" | "google" => ("zeroconfig-gcp-firestore", gcp::get_firestore_endpoint()),
            _ => return Ok(()),
        };

        match self.docker.inspect_container(container_name, None).await {
            Ok(info) => {
                let status = info.state
                    .and_then(|s| s.status)
                    .map(|s| format!("{:?}", s))
                    .unwrap_or_else(|| "unknown".to_string());

                println!("Cloud Emulator Status:");
                println!("  Provider: {}", self.provider);
                println!("  Status: {}", status);
                println!("  Endpoint: {}", endpoint);
            },
            Err(_) => {
                println!("Cloud Emulator Status:");
                println!("  Provider: {}", self.provider);
                println!("  Status: Not running");
            }
        }

        Ok(())
    }

    pub async fn ui(&self) -> Result<()> {
        let url = match self.provider.as_str() {
            "localstack" | "aws" => {
                println!("Opening LocalStack UI...");
                println!("Dashboard: https://app.localstack.cloud");
                "http://localhost:4566/_localstack/health"
            },
            "azure" | "azurite" => {
                println!("Opening Azure Storage Explorer...");
                println!("Connect using: {}", azurite::get_connection_string());
                "https://azure.microsoft.com/en-us/products/storage/storage-explorer/"
            },
            "gcp" | "google" => {
                println!("GCP Emulator Information:");
                println!("Firestore Emulator: {}", gcp::get_firestore_endpoint());
                return Ok(());
            },
            _ => return Ok(()),
        };

        // Try to open in browser
        #[cfg(target_os = "windows")]
        {
            let _ = std::process::Command::new("cmd")
                .args(&["/C", "start", url])
                .spawn();
        }

        #[cfg(target_os = "macos")]
        {
            let _ = std::process::Command::new("open")
                .arg(url)
                .spawn();
        }

        #[cfg(target_os = "linux")]
        {
            let _ = std::process::Command::new("xdg-open")
                .arg(url)
                .spawn();
        }

        Ok(())
    }
}
