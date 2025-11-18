use anyhow::{Context, Result};
use bollard::Docker;
use bollard::container::{Config, CreateContainerOptions, StartContainerOptions};
use bollard::image::CreateImageOptions;
use futures::StreamExt;
use tracing::{info, error};

pub mod localstack;

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
            "localstack" => self.start_localstack().await,
            "aws" => self.start_localstack().await, // Use LocalStack for AWS emulation
            _ => anyhow::bail!("Unsupported cloud provider: {}", self.provider),
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

    pub async fn stop(&self) -> Result<()> {
        info!("Stopping cloud emulation...");

        let container_name = match self.provider.as_str() {
            "localstack" | "aws" => "zeroconfig-localstack",
            _ => return Ok(()),
        };

        self.docker.stop_container(container_name, None).await
            .context("Failed to stop cloud emulator")?;

        self.docker.remove_container(container_name, None).await
            .context("Failed to remove cloud emulator")?;

        info!("Cloud emulation stopped");
        Ok(())
    }

    pub async fn status(&self) -> Result<()> {
        let container_name = match self.provider.as_str() {
            "localstack" | "aws" => "zeroconfig-localstack",
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
                println!("  Endpoint: http://localhost:4566");
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
        if self.provider == "localstack" {
            println!("Opening LocalStack UI...");
            println!("Visit: http://localhost:4566/_localstack/health");
            println!("Dashboard: https://app.localstack.cloud");

            // Try to open in browser
            #[cfg(target_os = "windows")]
            {
                let _ = std::process::Command::new("cmd")
                    .args(&["/C", "start", "http://localhost:4566/_localstack/health"])
                    .spawn();
            }

            #[cfg(target_os = "macos")]
            {
                let _ = std::process::Command::new("open")
                    .arg("http://localhost:4566/_localstack/health")
                    .spawn();
            }

            #[cfg(target_os = "linux")]
            {
                let _ = std::process::Command::new("xdg-open")
                    .arg("http://localhost:4566/_localstack/health")
                    .spawn();
            }
        }

        Ok(())
    }
}
