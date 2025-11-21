use anyhow::{Context, Result};
use std::process::Command;
use tracing::{info, warn};

pub mod detector;
pub mod version_manager;
pub mod container_runtime;

pub use container_runtime::{ContainerRuntime, ContainerRuntimeManager, RuntimeStatus};

/// Runtime information for a programming language/tool
#[derive(Debug, Clone)]
pub struct RuntimeInfo {
    pub name: String,
    pub installed_version: Option<String>,
    pub required_version: String,
    pub is_compatible: bool,
    pub install_command: Option<String>,
}

/// Runtime manager that detects and validates installed runtimes
pub struct RuntimeManager {
    runtimes: Vec<RuntimeInfo>,
}

impl RuntimeManager {
    pub fn new() -> Self {
        Self {
            runtimes: Vec::new(),
        }
    }

    /// Check if a runtime is installed and get its version
    pub async fn check_runtime(&mut self, name: &str, required_version: &str) -> Result<RuntimeInfo> {
        info!("Checking runtime: {} (required: {})", name, required_version);

        let installed_version = self.get_installed_version(name).await;
        let is_compatible = if let Some(ref installed) = installed_version {
            self.is_version_compatible(name, installed, required_version)
        } else {
            false
        };

        let runtime_info = RuntimeInfo {
            name: name.to_string(),
            installed_version: installed_version.clone(),
            required_version: required_version.to_string(),
            is_compatible,
            install_command: if !is_compatible {
                Some(self.get_install_command(name, required_version))
            } else {
                None
            },
        };

        self.runtimes.push(runtime_info.clone());

        Ok(runtime_info)
    }

    /// Get installed version of a runtime
    async fn get_installed_version(&self, name: &str) -> Option<String> {
        let version_cmd = match name {
            "node" => vec!["node", "--version"],
            "python" => vec!["python", "--version"],
            "python3" => vec!["python3", "--version"],
            "go" => vec!["go", "version"],
            "rust" => vec!["rustc", "--version"],
            "java" => vec!["java", "--version"],
            "dotnet" => vec!["dotnet", "--version"],
            "ruby" => vec!["ruby", "--version"],
            "php" => vec!["php", "--version"],
            "docker" => vec!["docker", "--version"],
            "podman" => vec!["podman", "--version"],
            "minikube" => vec!["minikube", "version"],
            "kubectl" => vec!["kubectl", "version", "--client"],
            "docker-compose" => vec!["docker-compose", "--version"],
            "nerdctl" => vec!["nerdctl", "--version"],
            "containerd" => vec!["ctr", "version"],
            "crictl" => vec!["crictl", "--version"],
            "colima" => vec!["colima", "version"],
            _ => return None,
        };

        match Command::new(version_cmd[0])
            .args(&version_cmd[1..])
            .output()
        {
            Ok(output) if output.status.success() => {
                let version_str = String::from_utf8_lossy(&output.stdout);
                Some(self.extract_version(name, &version_str))
            }
            Ok(_) => {
                // Try stderr (some tools output version to stderr)
                let output = Command::new(version_cmd[0])
                    .args(&version_cmd[1..])
                    .output()
                    .ok()?;
                let version_str = String::from_utf8_lossy(&output.stderr);
                Some(self.extract_version(name, &version_str))
            }
            Err(_) => None,
        }
    }

    /// Extract version number from version string
    fn extract_version(&self, name: &str, version_str: &str) -> String {
        // Extract version based on runtime-specific patterns
        match name {
            "node" => {
                // v20.11.0 -> 20.11.0
                version_str
                    .trim()
                    .trim_start_matches('v')
                    .split_whitespace()
                    .next()
                    .unwrap_or("")
                    .to_string()
            }
            "python" | "python3" => {
                // Python 3.11.0 -> 3.11.0
                version_str
                    .split_whitespace()
                    .nth(1)
                    .unwrap_or("")
                    .to_string()
            }
            "go" => {
                // go version go1.23.0 linux/amd64 -> 1.23.0
                version_str
                    .split_whitespace()
                    .nth(2)
                    .and_then(|v| v.strip_prefix("go"))
                    .unwrap_or("")
                    .to_string()
            }
            "rust" => {
                // rustc 1.75.0 (hash date) -> 1.75.0
                version_str
                    .split_whitespace()
                    .nth(1)
                    .unwrap_or("")
                    .to_string()
            }
            "java" => {
                // java 22.0.1 -> 22.0.1
                version_str
                    .lines()
                    .next()
                    .and_then(|line| line.split_whitespace().nth(1))
                    .unwrap_or("")
                    .to_string()
            }
            "dotnet" => {
                // 8.0.100 -> 8.0.100
                version_str.trim().to_string()
            }
            _ => version_str.trim().to_string(),
        }
    }

    /// Check if installed version is compatible with required version
    fn is_version_compatible(&self, _name: &str, installed: &str, required: &str) -> bool {
        // Handle special cases
        if required == "latest" || required == "stable" {
            return !installed.is_empty();
        }

        // For major version matching (e.g., "20" matches "20.x.x" or newer)
        if let Ok(required_major) = required.parse::<u32>() {
            // Extract installed major version
            if let Some(installed_major_str) = installed.split('.').next() {
                if let Ok(installed_major) = installed_major_str.parse::<u32>() {
                    // Compatible if installed major version is >= required
                    return installed_major >= required_major;
                }
            }
            return false;
        }

        // Exact or prefix match
        installed.starts_with(required) || installed == required
    }

    /// Get install command for a runtime
    fn get_install_command(&self, name: &str, version: &str) -> String {
        match name {
            "node" => format!("Visit https://nodejs.org/ or use nvm: nvm install {}", version),
            "python" | "python3" => {
                format!("Visit https://python.org/ or use pyenv: pyenv install {}", version)
            }
            "go" => format!("Visit https://golang.org/dl/ or use gvm: gvm install go{}", version),
            "rust" => {
                format!("Visit https://rustup.rs/ or run: rustup install {}", version)
            }
            "java" => {
                format!("Visit https://adoptium.net/ or use sdkman: sdk install java {}", version)
            }
            "dotnet" => {
                format!("Visit https://dotnet.microsoft.com/ or use: dotnet-install.sh --version {}", version)
            }
            "docker" => "Visit https://docs.docker.com/get-docker/ to install Docker Desktop".to_string(),
            "podman" => "Visit https://podman.io/getting-started/installation to install Podman".to_string(),
            "minikube" => "Visit https://minikube.sigs.k8s.io/docs/start/ to install Minikube".to_string(),
            "kubectl" => "Visit https://kubernetes.io/docs/tasks/tools/ to install kubectl".to_string(),
            "docker-compose" => "Visit https://docs.docker.com/compose/install/ to install Docker Compose".to_string(),
            "nerdctl" => "Visit https://github.com/containerd/nerdctl to install nerdctl".to_string(),
            "containerd" => "Visit https://containerd.io/downloads/ to install containerd".to_string(),
            "crictl" => "Visit https://github.com/kubernetes-sigs/cri-tools to install crictl".to_string(),
            "colima" => "Visit https://github.com/abiosoft/colima to install Colima (macOS/Linux)".to_string(),
            _ => format!("Please install {} version {}", name, version),
        }
    }

    /// Check if Docker is installed and running
    pub async fn check_docker(&self) -> Result<bool> {
        let output = Command::new("docker")
            .arg("ps")
            .output()
            .context("Docker is not installed or not in PATH")?;

        if !output.status.success() {
            warn!("Docker is installed but not running");
            return Ok(false);
        }

        Ok(true)
    }

    /// Get all runtime check results
    pub fn get_results(&self) -> &[RuntimeInfo] {
        &self.runtimes
    }

    /// Check if all required runtimes are compatible
    pub fn all_compatible(&self) -> bool {
        self.runtimes.iter().all(|r| r.is_compatible)
    }
}

impl Default for RuntimeManager {
    fn default() -> Self {
        Self::new()
    }
}
