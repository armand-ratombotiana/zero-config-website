use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use anyhow::{Context, Result};

/// Main ZeroConfig configuration structure parsed from zero.yml
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZeroConfig {
    /// Programming language runtimes and their versions
    #[serde(default)]
    pub languages: HashMap<String, String>,

    /// Services to provision (databases, queues, caches, etc.)
    #[serde(default)]
    pub services: HashMap<String, ServiceConfig>,

    /// Cloud emulation configuration
    #[serde(default)]
    pub cloud: Option<CloudConfig>,

    /// Environment variables
    #[serde(default)]
    pub env: HashMap<String, String>,

    /// Port configuration
    #[serde(default)]
    pub ports: PortConfig,

    /// Startup commands to run after environment is ready
    #[serde(default)]
    pub startup: Vec<String>,

    /// Optional project metadata
    #[serde(default)]
    pub metadata: ProjectMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceConfig {
    pub version: String,

    #[serde(default)]
    pub port: PortValue,

    #[serde(default)]
    pub environment: HashMap<String, String>,

    #[serde(default)]
    pub volumes: Vec<String>,

    #[serde(default)]
    pub command: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum PortValue {
    Auto,
    Fixed(u16),
    Range(PortRange),
}

impl Default for PortValue {
    fn default() -> Self {
        PortValue::Auto
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortRange {
    pub min: u16,
    pub max: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum PortConfig {
    Auto,
    Manual(HashMap<String, u16>),
}

impl Default for PortConfig {
    fn default() -> Self {
        PortConfig::Auto
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudConfig {
    #[serde(default)]
    pub localstack: Option<String>,

    #[serde(default)]
    pub aws: Option<AwsConfig>,

    #[serde(default)]
    pub azure: Option<AzureConfig>,

    #[serde(default)]
    pub gcp: Option<GcpConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AwsConfig {
    pub services: Vec<String>,
    pub region: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AzureConfig {
    pub services: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GcpConfig {
    pub services: Vec<String>,
    pub project: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ProjectMetadata {
    pub name: Option<String>,
    pub description: Option<String>,
    pub version: Option<String>,
    pub team: Option<String>,
}

impl ZeroConfig {
    /// Load configuration from zero.yml file
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
        let content = std::fs::read_to_string(path.as_ref())
            .context("Failed to read zero.yml")?;

        Self::from_str(&content)
    }

    /// Parse configuration from YAML string
    pub fn from_str(content: &str) -> Result<Self> {
        serde_yaml::from_str(content)
            .context("Failed to parse zero.yml")
    }

    /// Validate the configuration
    pub fn validate(&self) -> Result<()> {
        // Validate language versions
        for (lang, version) in &self.languages {
            if version.is_empty() {
                anyhow::bail!("Language '{}' has empty version", lang);
            }
        }

        // Validate service configurations
        for (service, config) in &self.services {
            if config.version.is_empty() {
                anyhow::bail!("Service '{}' has empty version", service);
            }
        }

        // Validate port ranges
        if let PortConfig::Manual(ports) = &self.ports {
            for (service, port) in ports {
                if *port == 0 || *port > 65535 {
                    anyhow::bail!("Invalid port {} for service '{}'", port, service);
                }
            }
        }

        Ok(())
    }

    /// Find zero.yml in current directory or parent directories
    pub fn discover() -> Result<Option<Self>> {
        let current_dir = std::env::current_dir()
            .context("Failed to get current directory")?;

        let mut dir = current_dir.as_path();

        loop {
            let config_path = dir.join("zero.yml");
            if config_path.exists() {
                return Ok(Some(Self::from_file(config_path)?));
            }

            // Check for alternate name
            let alt_path = dir.join("zero.yaml");
            if alt_path.exists() {
                return Ok(Some(Self::from_file(alt_path)?));
            }

            match dir.parent() {
                Some(parent) => dir = parent,
                None => return Ok(None),
            }
        }
    }

    /// Get all required runtime languages
    pub fn get_runtimes(&self) -> Vec<(String, String)> {
        self.languages.iter()
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect()
    }

    /// Get all services to provision
    pub fn get_services(&self) -> Vec<(String, ServiceConfig)> {
        self.services.iter()
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_basic_config() {
        let yaml = r#"
languages:
  node: "20"
  python: "3.11"

services:
  postgres:
    version: "16"
    port: auto

env:
  MODE: development
        "#;

        let config = ZeroConfig::from_str(yaml).unwrap();
        assert_eq!(config.languages.get("node"), Some(&"20".to_string()));
        assert_eq!(config.services.len(), 1);
    }
}
