use anyhow::Result;
use bollard::Docker;
use bollard::exec::{CreateExecOptions, StartExecResults};
use futures::StreamExt;
use std::time::{Duration, Instant};
use tracing::{info, warn};

#[derive(Debug, Clone)]
pub struct HealthStatus {
    pub service_name: String,
    pub is_healthy: bool,
    pub status_message: String,
    pub response_time_ms: u64,
    pub last_check: std::time::SystemTime,
}

pub struct HealthChecker {
    docker: Docker,
}

impl HealthChecker {
    pub async fn new() -> Result<Self> {
        let docker = Docker::connect_with_local_defaults()?;
        Ok(Self { docker })
    }

    /// Check health of a specific container
    pub async fn check_container(&self, container_id: &str, service_name: &str) -> Result<HealthStatus> {
        let start = Instant::now();

        // First check if container is running
        match self.docker.inspect_container(container_id, None).await {
            Ok(info) => {
                let state = info.state.unwrap_or_default();
                let status_str = state.status
                    .map(|s| format!("{:?}", s))
                    .unwrap_or_else(|| "Unknown".to_string());

                if status_str != "Running" {
                    return Ok(HealthStatus {
                        service_name: service_name.to_string(),
                        is_healthy: false,
                        status_message: format!("Container not running: {}", status_str),
                        response_time_ms: start.elapsed().as_millis() as u64,
                        last_check: std::time::SystemTime::now(),
                    });
                }

                // Check container health status if available
                if let Some(health) = state.health {
                    let health_status_str = health.status
                        .map(|s| format!("{:?}", s))
                        .unwrap_or_else(|| "Unknown".to_string());
                    let is_healthy = health_status_str == "Healthy";

                    return Ok(HealthStatus {
                        service_name: service_name.to_string(),
                        is_healthy,
                        status_message: health_status_str,
                        response_time_ms: start.elapsed().as_millis() as u64,
                        last_check: std::time::SystemTime::now(),
                    });
                }

                // If no health check defined, perform service-specific health check
                let health_result = self.perform_service_health_check(container_id, service_name).await;

                let response_time = start.elapsed().as_millis() as u64;

                match health_result {
                    Ok(message) => Ok(HealthStatus {
                        service_name: service_name.to_string(),
                        is_healthy: true,
                        status_message: message,
                        response_time_ms: response_time,
                        last_check: std::time::SystemTime::now(),
                    }),
                    Err(e) => Ok(HealthStatus {
                        service_name: service_name.to_string(),
                        is_healthy: false,
                        status_message: format!("Health check failed: {}", e),
                        response_time_ms: response_time,
                        last_check: std::time::SystemTime::now(),
                    }),
                }
            }
            Err(e) => Ok(HealthStatus {
                service_name: service_name.to_string(),
                is_healthy: false,
                status_message: format!("Failed to inspect container: {}", e),
                response_time_ms: start.elapsed().as_millis() as u64,
                last_check: std::time::SystemTime::now(),
            }),
        }
    }

    /// Perform service-specific health check
    async fn perform_service_health_check(&self, container_id: &str, service_name: &str) -> Result<String> {
        let health_command = self.get_health_command(service_name);

        if health_command.is_empty() {
            return Ok("Running (no health check available)".to_string());
        }

        let exec_config = CreateExecOptions {
            attach_stdout: Some(true),
            attach_stderr: Some(true),
            cmd: Some(health_command.iter().map(|s| s.as_str()).collect()),
            ..Default::default()
        };

        let exec = self.docker.create_exec(container_id, exec_config).await?;

        match self.docker.start_exec(&exec.id, None).await? {
            StartExecResults::Attached { mut output, .. } => {
                let mut result = String::new();

                while let Some(chunk) = output.next().await {
                    if let Ok(log_output) = chunk {
                        result.push_str(&format!("{}", log_output));
                    }
                }

                if result.contains("accepting connections") || result.contains("ready") {
                    Ok("Healthy".to_string())
                } else {
                    Ok("Running".to_string())
                }
            }
            _ => Ok("Running".to_string()),
        }
    }

    /// Get health check command for a service
    fn get_health_command(&self, service_name: &str) -> Vec<String> {
        match service_name {
            s if s.contains("postgres") => vec![
                "pg_isready".to_string(),
                "-U".to_string(),
                "postgres".to_string(),
            ],
            s if s.contains("redis") => vec![
                "redis-cli".to_string(),
                "ping".to_string(),
            ],
            s if s.contains("mongo") => vec![
                "mongosh".to_string(),
                "--eval".to_string(),
                "db.adminCommand('ping')".to_string(),
            ],
            s if s.contains("mysql") => vec![
                "mysqladmin".to_string(),
                "ping".to_string(),
                "-h".to_string(),
                "localhost".to_string(),
            ],
            s if s.contains("rabbitmq") => vec![
                "rabbitmq-diagnostics".to_string(),
                "ping".to_string(),
            ],
            s if s.contains("elasticsearch") => vec![
                "curl".to_string(),
                "-f".to_string(),
                "http://localhost:9200/_cluster/health".to_string(),
            ],
            _ => vec![],
        }
    }

    /// Wait for a service to become healthy
    pub async fn wait_for_healthy(
        &self,
        container_id: &str,
        service_name: &str,
        timeout: Duration,
    ) -> Result<HealthStatus> {
        let start = Instant::now();

        loop {
            let status = self.check_container(container_id, service_name).await?;

            if status.is_healthy {
                return Ok(status);
            }

            if start.elapsed() > timeout {
                anyhow::bail!("Timeout waiting for {} to become healthy", service_name);
            }

            info!("Waiting for {} to become healthy...", service_name);
            tokio::time::sleep(Duration::from_secs(2)).await;
        }
    }
}

/// Format health status for display
pub fn format_health_status(status: &HealthStatus) -> String {
    let health_indicator = if status.is_healthy { "✓" } else { "✗" };
    let color = if status.is_healthy { "\x1b[32m" } else { "\x1b[31m" };
    let reset = "\x1b[0m";

    format!(
        "{}{}{} {} - {} ({}ms)",
        color,
        health_indicator,
        reset,
        status.service_name,
        status.status_message,
        status.response_time_ms
    )
}
