use anyhow::{anyhow, Context, Result};
use std::process::Command;
use tracing::{info, warn};
use serde::{Deserialize, Serialize};

/// Supported container runtimes
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ContainerRuntime {
    Docker,
    Podman,
    Minikube,
    Kubernetes,
    DockerCompose,
    Containerd,
    CriO,
    Nerdctl,
    Colima,
}

impl ContainerRuntime {
    /// Get the command name for this runtime
    pub fn command(&self) -> &'static str {
        match self {
            Self::Docker => "docker",
            Self::Podman => "podman",
            Self::Minikube => "minikube",
            Self::Kubernetes => "kubectl",
            Self::DockerCompose => "docker-compose",
            Self::Containerd => "ctr",
            Self::CriO => "crictl",
            Self::Nerdctl => "nerdctl",
            Self::Colima => "colima",
        }
    }

    /// Get the version command arguments
    pub fn version_args(&self) -> Vec<&'static str> {
        match self {
            Self::Docker | Self::Podman | Self::Nerdctl => vec!["--version"],
            Self::Minikube => vec!["version"],
            Self::Kubernetes => vec!["version", "--client"],
            Self::DockerCompose => vec!["--version"],
            Self::Containerd | Self::CriO => vec!["version"],
            Self::Colima => vec!["version"],
        }
    }

    /// Get the status check command arguments
    pub fn status_args(&self) -> Vec<&'static str> {
        match self {
            Self::Docker | Self::Podman | Self::Nerdctl => vec!["ps"],
            Self::Minikube => vec!["status"],
            Self::Kubernetes => vec!["cluster-info"],
            Self::DockerCompose => vec!["ps"],
            Self::Containerd => vec!["containers", "list"],
            Self::CriO => vec!["ps"],
            Self::Colima => vec!["status"],
        }
    }

    /// Get the list containers command arguments
    pub fn list_containers_args(&self) -> Vec<&'static str> {
        match self {
            Self::Docker | Self::Podman | Self::Nerdctl => vec!["ps", "-a", "--format", "json"],
            Self::Minikube => vec!["kubectl", "--", "get", "pods", "-o", "json"],
            Self::Kubernetes => vec!["get", "pods", "-o", "json"],
            Self::DockerCompose => vec!["ps", "--format", "json"],
            Self::Containerd => vec!["containers", "list"],
            Self::CriO => vec!["ps", "-a", "--output", "json"],
            Self::Colima => vec!["list"],
        }
    }

    /// Get the start container command arguments
    pub fn start_container_args(&self, container_id: &str) -> Vec<String> {
        match self {
            Self::Docker | Self::Podman | Self::Nerdctl => {
                vec!["start".to_string(), container_id.to_string()]
            }
            Self::Minikube => {
                vec!["kubectl".to_string(), "--".to_string(), "apply".to_string(), "-f".to_string(), container_id.to_string()]
            }
            Self::Kubernetes => {
                vec!["apply".to_string(), "-f".to_string(), container_id.to_string()]
            }
            Self::DockerCompose => {
                vec!["up".to_string(), "-d".to_string(), container_id.to_string()]
            }
            Self::Containerd => {
                vec!["tasks".to_string(), "start".to_string(), container_id.to_string()]
            }
            Self::CriO => {
                vec!["start".to_string(), container_id.to_string()]
            }
            Self::Colima => {
                vec!["start".to_string()]
            }
        }
    }

    /// Get the stop container command arguments
    pub fn stop_container_args(&self, container_id: &str) -> Vec<String> {
        match self {
            Self::Docker | Self::Podman | Self::Nerdctl => {
                vec!["stop".to_string(), container_id.to_string()]
            }
            Self::Minikube => {
                vec!["kubectl".to_string(), "--".to_string(), "delete".to_string(), "pod".to_string(), container_id.to_string()]
            }
            Self::Kubernetes => {
                vec!["delete".to_string(), "pod".to_string(), container_id.to_string()]
            }
            Self::DockerCompose => {
                vec!["stop".to_string(), container_id.to_string()]
            }
            Self::Containerd => {
                vec!["tasks".to_string(), "kill".to_string(), container_id.to_string()]
            }
            Self::CriO => {
                vec!["stop".to_string(), container_id.to_string()]
            }
            Self::Colima => {
                vec!["stop".to_string()]
            }
        }
    }

    /// Get the restart container command arguments
    pub fn restart_container_args(&self, container_id: &str) -> Vec<String> {
        match self {
            Self::Docker | Self::Podman | Self::Nerdctl => {
                vec!["restart".to_string(), container_id.to_string()]
            }
            Self::Minikube | Self::Kubernetes => {
                vec!["rollout".to_string(), "restart".to_string(), "deployment".to_string(), container_id.to_string()]
            }
            Self::DockerCompose => {
                vec!["restart".to_string(), container_id.to_string()]
            }
            Self::Containerd | Self::CriO => {
                // Restart by stop + start
                vec!["restart".to_string(), container_id.to_string()]
            }
            Self::Colima => {
                vec!["restart".to_string()]
            }
        }
    }

    /// Get the logs command arguments
    pub fn logs_args(&self, container_id: &str, follow: bool, tail: Option<usize>) -> Vec<String> {
        match self {
            Self::Docker | Self::Podman | Self::Nerdctl => {
                let mut args = vec!["logs".to_string()];
                if follow {
                    args.push("-f".to_string());
                }
                if let Some(n) = tail {
                    args.push("--tail".to_string());
                    args.push(n.to_string());
                }
                args.push(container_id.to_string());
                args
            }
            Self::Minikube => {
                let mut args = vec!["kubectl".to_string(), "--".to_string(), "logs".to_string()];
                if follow {
                    args.push("-f".to_string());
                }
                if let Some(n) = tail {
                    args.push("--tail".to_string());
                    args.push(n.to_string());
                }
                args.push(container_id.to_string());
                args
            }
            Self::Kubernetes => {
                let mut args = vec!["logs".to_string()];
                if follow {
                    args.push("-f".to_string());
                }
                if let Some(n) = tail {
                    args.push("--tail".to_string());
                    args.push(n.to_string());
                }
                args.push(container_id.to_string());
                args
            }
            Self::DockerCompose => {
                let mut args = vec!["logs".to_string()];
                if follow {
                    args.push("-f".to_string());
                }
                if let Some(n) = tail {
                    args.push("--tail".to_string());
                    args.push(n.to_string());
                }
                args.push(container_id.to_string());
                args
            }
            Self::Containerd | Self::CriO => {
                vec!["logs".to_string(), container_id.to_string()]
            }
            Self::Colima => {
                vec!["logs".to_string()]
            }
        }
    }

    /// Check if this runtime is installed
    pub async fn is_installed(&self) -> bool {
        Command::new(self.command())
            .args(self.version_args())
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    }

    /// Check if this runtime is running
    pub async fn is_running(&self) -> bool {
        Command::new(self.command())
            .args(self.status_args())
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    }

    /// Get the installed version
    pub async fn get_version(&self) -> Result<String> {
        let output = Command::new(self.command())
            .args(self.version_args())
            .output()
            .context(format!("{} is not installed or not in PATH", self.command()))?;

        if !output.status.success() {
            return Err(anyhow!("{} version command failed", self.command()));
        }

        let version_str = String::from_utf8_lossy(&output.stdout);
        Ok(version_str.trim().to_string())
    }

    /// Get runtime name as string
    pub fn name(&self) -> &'static str {
        match self {
            Self::Docker => "Docker",
            Self::Podman => "Podman",
            Self::Minikube => "Minikube",
            Self::Kubernetes => "Kubernetes",
            Self::DockerCompose => "Docker Compose",
            Self::Containerd => "containerd",
            Self::CriO => "CRI-O",
            Self::Nerdctl => "nerdctl",
            Self::Colima => "Colima",
        }
    }

    /// Check if runtime supports Docker API compatibility
    pub fn is_docker_compatible(&self) -> bool {
        matches!(self, Self::Docker | Self::Podman | Self::Nerdctl | Self::Colima)
    }

    /// Check if runtime supports Kubernetes API
    pub fn is_kubernetes_compatible(&self) -> bool {
        matches!(self, Self::Minikube | Self::Kubernetes)
    }
}

/// Container runtime manager that detects and manages available runtimes
pub struct ContainerRuntimeManager {
    available_runtimes: Vec<ContainerRuntime>,
    preferred_runtime: Option<ContainerRuntime>,
}

impl ContainerRuntimeManager {
    /// Create a new runtime manager
    pub fn new() -> Self {
        Self {
            available_runtimes: Vec::new(),
            preferred_runtime: None,
        }
    }

    /// Detect all available container runtimes
    pub async fn detect_runtimes(&mut self) -> Result<()> {
        info!("Detecting available container runtimes...");

        let all_runtimes = vec![
            ContainerRuntime::Docker,
            ContainerRuntime::Podman,
            ContainerRuntime::Minikube,
            ContainerRuntime::Kubernetes,
            ContainerRuntime::DockerCompose,
            ContainerRuntime::Containerd,
            ContainerRuntime::CriO,
            ContainerRuntime::Nerdctl,
            ContainerRuntime::Colima,
        ];

        for runtime in all_runtimes {
            if runtime.is_installed().await {
                info!("Found {} - {}", runtime.name(), runtime.get_version().await.unwrap_or_else(|_| "version unknown".to_string()));
                self.available_runtimes.push(runtime);

                // Set preferred runtime (prioritize Docker, then Podman, then others)
                if self.preferred_runtime.is_none() {
                    match runtime {
                        ContainerRuntime::Docker => {
                            if runtime.is_running().await {
                                self.preferred_runtime = Some(runtime);
                                info!("Using {} as preferred runtime", runtime.name());
                            }
                        }
                        ContainerRuntime::Podman => {
                            if self.preferred_runtime.is_none() && runtime.is_running().await {
                                self.preferred_runtime = Some(runtime);
                                info!("Using {} as preferred runtime", runtime.name());
                            }
                        }
                        _ => {}
                    }
                }
            }
        }

        if self.available_runtimes.is_empty() {
            warn!("No container runtimes detected!");
            return Err(anyhow!("No container runtime found. Please install Docker, Podman, or another container runtime."));
        }

        // If no preferred runtime set yet, use the first available
        if self.preferred_runtime.is_none() {
            self.preferred_runtime = self.available_runtimes.first().copied();
        }

        Ok(())
    }

    /// Get the preferred runtime
    pub fn get_preferred_runtime(&self) -> Result<ContainerRuntime> {
        self.preferred_runtime
            .ok_or_else(|| anyhow!("No container runtime available"))
    }

    /// Set the preferred runtime
    pub fn set_preferred_runtime(&mut self, runtime: ContainerRuntime) -> Result<()> {
        if !self.available_runtimes.contains(&runtime) {
            return Err(anyhow!("{} is not installed or not available", runtime.name()));
        }
        self.preferred_runtime = Some(runtime);
        info!("Switched to {} runtime", runtime.name());
        Ok(())
    }

    /// Get all available runtimes
    pub fn get_available_runtimes(&self) -> &[ContainerRuntime] {
        &self.available_runtimes
    }

    /// Check if a specific runtime is available
    pub fn is_runtime_available(&self, runtime: ContainerRuntime) -> bool {
        self.available_runtimes.contains(&runtime)
    }

    /// Get runtime status information
    pub async fn get_runtime_status(&self, runtime: ContainerRuntime) -> RuntimeStatus {
        RuntimeStatus {
            runtime,
            installed: runtime.is_installed().await,
            running: runtime.is_running().await,
            version: runtime.get_version().await.ok(),
            docker_compatible: runtime.is_docker_compatible(),
            kubernetes_compatible: runtime.is_kubernetes_compatible(),
        }
    }

    /// Get status for all detected runtimes
    pub async fn get_all_runtime_status(&self) -> Vec<RuntimeStatus> {
        let mut statuses = Vec::new();
        for runtime in &self.available_runtimes {
            statuses.push(self.get_runtime_status(*runtime).await);
        }
        statuses
    }
}

impl Default for ContainerRuntimeManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Runtime status information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeStatus {
    pub runtime: ContainerRuntime,
    pub installed: bool,
    pub running: bool,
    pub version: Option<String>,
    pub docker_compatible: bool,
    pub kubernetes_compatible: bool,
}

impl RuntimeStatus {
    /// Check if runtime is ready to use
    pub fn is_ready(&self) -> bool {
        self.installed && self.running
    }

    /// Get a human-readable status string
    pub fn status_string(&self) -> String {
        if !self.installed {
            format!("{}: Not installed", self.runtime.name())
        } else if !self.running {
            format!("{}: Installed but not running", self.runtime.name())
        } else {
            format!(
                "{}: Ready ({})",
                self.runtime.name(),
                self.version.as_ref().unwrap_or(&"version unknown".to_string())
            )
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_detect_runtimes() {
        let mut manager = ContainerRuntimeManager::new();
        let result = manager.detect_runtimes().await;

        // Should detect at least one runtime (or fail gracefully)
        if let Ok(()) = result {
            assert!(!manager.get_available_runtimes().is_empty());
        }
    }

    #[test]
    fn test_runtime_commands() {
        assert_eq!(ContainerRuntime::Docker.command(), "docker");
        assert_eq!(ContainerRuntime::Podman.command(), "podman");
        assert_eq!(ContainerRuntime::Minikube.command(), "minikube");
        assert_eq!(ContainerRuntime::Kubernetes.command(), "kubectl");
    }

    #[test]
    fn test_docker_compatibility() {
        assert!(ContainerRuntime::Docker.is_docker_compatible());
        assert!(ContainerRuntime::Podman.is_docker_compatible());
        assert!(!ContainerRuntime::Kubernetes.is_docker_compatible());
    }

    #[test]
    fn test_kubernetes_compatibility() {
        assert!(ContainerRuntime::Kubernetes.is_kubernetes_compatible());
        assert!(ContainerRuntime::Minikube.is_kubernetes_compatible());
        assert!(!ContainerRuntime::Docker.is_kubernetes_compatible());
    }
}
