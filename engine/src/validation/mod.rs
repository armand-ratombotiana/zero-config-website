use anyhow::Result;

/// Input validation utilities for ZeroConfig
pub struct InputValidator;

impl InputValidator {
    /// Validate service name format
    pub fn validate_service_name(name: &str) -> Result<()> {
        if name.is_empty() {
            anyhow::bail!("Service name cannot be empty");
        }

        if name.len() > 64 {
            anyhow::bail!("Service name cannot exceed 64 characters");
        }

        // Service names should be alphanumeric with hyphens and underscores
        if !name.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
            anyhow::bail!("Service name can only contain alphanumeric characters, hyphens, and underscores");
        }

        // Cannot start with hyphen or underscore
        if name.starts_with('-') || name.starts_with('_') {
            anyhow::bail!("Service name cannot start with hyphen or underscore");
        }

        Ok(())
    }

    /// Validate port number
    pub fn validate_port(port: u16) -> Result<()> {
        if port < 1024 {
            anyhow::bail!("Port {} is reserved by the system. Please use ports 1024-65535", port);
        }

        Ok(())
    }

    /// Validate image name format
    pub fn validate_image_name(image: &str) -> Result<()> {
        if image.is_empty() {
            anyhow::bail!("Image name cannot be empty");
        }

        // Basic validation for Docker image format
        // Format: [registry/]repository[:tag]
        let parts: Vec<&str> = image.split(':').collect();
        if parts.len() > 2 {
            anyhow::bail!("Invalid image format. Expected [registry/]repository[:tag]");
        }

        Ok(())
    }

    /// Validate volume path
    pub fn validate_volume_path(path: &str) -> Result<()> {
        if path.is_empty() {
            anyhow::bail!("Volume path cannot be empty");
        }

        // Check for common invalid characters
        let invalid_chars = ['<', '>', '|', '\0'];
        if path.chars().any(|c| invalid_chars.contains(&c)) {
            anyhow::bail!("Volume path contains invalid characters");
        }

        Ok(())
    }

    /// Check if port is available
    pub fn is_port_available(port: u16) -> bool {
        use std::net::TcpListener;
        
        TcpListener::bind(format!("127.0.0.1:{}", port)).is_ok()
    }

    /// Find next available port starting from a given port
    pub fn find_available_port(start_port: u16) -> Option<u16> {
        for port in start_port..65535 {
            if Self::is_port_available(port) {
                return Some(port);
            }
        }
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_service_name() {
        assert!(InputValidator::validate_service_name("postgres").is_ok());
        assert!(InputValidator::validate_service_name("my-service").is_ok());
        assert!(InputValidator::validate_service_name("my_service").is_ok());
        assert!(InputValidator::validate_service_name("service123").is_ok());

        assert!(InputValidator::validate_service_name("").is_err());
        assert!(InputValidator::validate_service_name("-service").is_err());
        assert!(InputValidator::validate_service_name("_service").is_err());
        assert!(InputValidator::validate_service_name("my service").is_err());
        assert!(InputValidator::validate_service_name("my@service").is_err());
    }

    #[test]
    fn test_validate_port() {
        assert!(InputValidator::validate_port(3000).is_ok());
        assert!(InputValidator::validate_port(8080).is_ok());
        assert!(InputValidator::validate_port(65535).is_ok());

        assert!(InputValidator::validate_port(80).is_err());
        assert!(InputValidator::validate_port(443).is_err());
        assert!(InputValidator::validate_port(22).is_err());
    }

    #[test]
    fn test_validate_image_name() {
        assert!(InputValidator::validate_image_name("postgres:15").is_ok());
        assert!(InputValidator::validate_image_name("redis").is_ok());
        assert!(InputValidator::validate_image_name("docker.io/library/postgres:15").is_ok());

        assert!(InputValidator::validate_image_name("").is_err());
        assert!(InputValidator::validate_image_name("postgres:15:alpine").is_err());
    }
}
