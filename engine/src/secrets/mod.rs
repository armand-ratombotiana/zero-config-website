use rand::Rng;
use sha2::{Sha256, Digest};
use std::collections::HashMap;

/// Generate cryptographically secure random secrets
pub struct SecretGenerator;

impl SecretGenerator {
    /// Generate a random alphanumeric string of specified length
    pub fn generate_alphanumeric(length: usize) -> String {
        const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ\
                                 abcdefghijklmnopqrstuvwxyz\
                                 0123456789";
        let mut rng = rand::thread_rng();

        (0..length)
            .map(|_| {
                let idx = rng.gen_range(0..CHARSET.len());
                CHARSET[idx] as char
            })
            .collect()
    }

    /// Generate a hex-encoded random string
    pub fn generate_hex(length: usize) -> String {
        let mut rng = rand::thread_rng();
        let bytes: Vec<u8> = (0..length).map(|_| rng.gen()).collect();
        hex::encode(&bytes)
    }

    /// Generate a base64-encoded random string
    pub fn generate_base64(length: usize) -> String {
        use base64::{Engine as _, engine::general_purpose};
        let mut rng = rand::thread_rng();
        let bytes: Vec<u8> = (0..length).map(|_| rng.gen()).collect();
        general_purpose::STANDARD.encode(&bytes)
    }

    /// Generate a JWT secret (64 characters)
    pub fn generate_jwt_secret() -> String {
        Self::generate_alphanumeric(64)
    }

    /// Generate an API key (32 characters)
    pub fn generate_api_key() -> String {
        Self::generate_alphanumeric(32)
    }

    /// Generate a database password (24 characters)
    pub fn generate_db_password() -> String {
        Self::generate_alphanumeric(24)
    }

    /// Generate a UUID v4
    pub fn generate_uuid() -> String {
        uuid::Uuid::new_v4().to_string()
    }

    /// Hash a string using SHA256
    pub fn hash_sha256(input: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(input.as_bytes());
        format!("{:x}", hasher.finalize())
    }
}

/// Manager for generating and tracking environment variables and secrets
pub struct EnvManager {
    env_vars: HashMap<String, String>,
    secrets: HashMap<String, String>,
}

impl EnvManager {
    pub fn new() -> Self {
        Self {
            env_vars: HashMap::new(),
            secrets: HashMap::new(),
        }
    }

    /// Process environment variables and auto-generate secrets
    pub fn process_env_vars(&mut self, env_config: &HashMap<String, String>) {
        for (key, value) in env_config {
            match value.as_str() {
                "auto-generate" => {
                    let generated = self.auto_generate_for_key(key);
                    self.secrets.insert(key.clone(), generated.clone());
                    self.env_vars.insert(key.clone(), generated);
                }
                _ => {
                    self.env_vars.insert(key.clone(), value.clone());
                }
            }
        }
    }

    /// Auto-generate appropriate value based on key name
    fn auto_generate_for_key(&self, key: &str) -> String {
        let key_lower = key.to_lowercase();

        if key_lower.contains("jwt") || key_lower.contains("secret_key") {
            SecretGenerator::generate_jwt_secret()
        } else if key_lower.contains("api_key") {
            SecretGenerator::generate_api_key()
        } else if key_lower.contains("password") || key_lower.contains("pass") {
            SecretGenerator::generate_db_password()
        } else if key_lower.contains("uuid") || key_lower.contains("id") {
            SecretGenerator::generate_uuid()
        } else if key_lower.contains("database_url") {
            "postgresql://zeroconfig:zeroconfig@localhost:5432/zeroconfig".to_string()
        } else if key_lower.contains("redis_url") {
            "redis://localhost:6379".to_string()
        } else if key_lower.contains("mongodb_url") {
            "mongodb://localhost:27017/zeroconfig".to_string()
        } else if key_lower.contains("rabbitmq_url") {
            "amqp://admin:admin@localhost:5672".to_string()
        } else {
            SecretGenerator::generate_alphanumeric(32)
        }
    }

    /// Generate connection string for a service
    pub fn generate_connection_string(
        &self,
        service: &str,
        host: &str,
        port: u16,
        database: &str,
        username: &str,
        password: &str,
    ) -> String {
        match service {
            "postgres" | "postgresql" => {
                format!("postgresql://{}:{}@{}:{}/{}", username, password, host, port, database)
            }
            "mysql" => {
                format!("mysql://{}:{}@{}:{}/{}", username, password, host, port, database)
            }
            "mongodb" | "mongo" => {
                format!("mongodb://{}:{}@{}:{}/{}", username, password, host, port, database)
            }
            "redis" => {
                format!("redis://{}:{}", host, port)
            }
            "rabbitmq" => {
                format!("amqp://{}:{}@{}:{}", username, password, host, port)
            }
            _ => format!("{}://{}:{}", service, host, port),
        }
    }

    /// Get all environment variables
    pub fn get_env_vars(&self) -> &HashMap<String, String> {
        &self.env_vars
    }

    /// Get all generated secrets
    pub fn get_secrets(&self) -> &HashMap<String, String> {
        &self.secrets
    }

    /// Export environment variables in shell format
    pub fn export_shell(&self) -> String {
        let mut output = String::new();
        for (key, value) in &self.env_vars {
            output.push_str(&format!("export {}=\"{}\"\n", key, value));
        }
        output
    }

    /// Export environment variables in .env format
    pub fn export_dotenv(&self) -> String {
        let mut output = String::new();
        for (key, value) in &self.env_vars {
            output.push_str(&format!("{}={}\n", key, value));
        }
        output
    }

    /// Export environment variables in JSON format
    pub fn export_json(&self) -> serde_json::Result<String> {
        serde_json::to_string_pretty(&self.env_vars)
    }

    /// Export environment variables in YAML format
    pub fn export_yaml(&self) -> serde_yaml::Result<String> {
        serde_yaml::to_string(&self.env_vars)
    }
}

impl Default for EnvManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Credential storage for persisting generated secrets
pub struct CredentialStore {
    project_path: std::path::PathBuf,
    credentials: HashMap<String, String>,
}

impl CredentialStore {
    /// Create a new credential store for a project
    pub fn new(project_path: std::path::PathBuf) -> Self {
        Self {
            project_path,
            credentials: HashMap::new(),
        }
    }

    /// Load credentials from .env file
    pub fn load(&mut self) -> anyhow::Result<()> {
        let env_file = self.project_path.join(".zeroconfig.env");
        
        if !env_file.exists() {
            return Ok(());
        }

        let content = std::fs::read_to_string(&env_file)?;
        
        for line in content.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            
            if let Some((key, value)) = line.split_once('=') {
                self.credentials.insert(key.to_string(), value.to_string());
            }
        }

        Ok(())
    }

    /// Save credentials to .env file
    pub fn save(&self) -> anyhow::Result<()> {
        let env_file = self.project_path.join(".zeroconfig.env");
        
        let mut content = String::from("# ZeroConfig Generated Credentials\n");
        content.push_str("# DO NOT COMMIT THIS FILE TO VERSION CONTROL\n\n");
        
        for (key, value) in &self.credentials {
            content.push_str(&format!("{}={}\n", key, value));
        }

        std::fs::write(&env_file, content)?;
        Ok(())
    }

    /// Get or generate a credential
    pub fn get_or_generate(&mut self, key: &str, generator: impl FnOnce() -> String) -> String {
        if let Some(value) = self.credentials.get(key) {
            value.clone()
        } else {
            let value = generator();
            self.credentials.insert(key.to_string(), value.clone());
            value
        }
    }

    /// Get a credential
    pub fn get(&self, key: &str) -> Option<&String> {
        self.credentials.get(key)
    }

    /// Set a credential
    pub fn set(&mut self, key: String, value: String) {
        self.credentials.insert(key, value);
    }

    /// Get all credentials
    pub fn get_all(&self) -> &HashMap<String, String> {
        &self.credentials
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_alphanumeric() {
        let secret = SecretGenerator::generate_alphanumeric(32);
        assert_eq!(secret.len(), 32);
        assert!(secret.chars().all(|c| c.is_alphanumeric()));
    }

    #[test]
    fn test_generate_jwt_secret() {
        let secret = SecretGenerator::generate_jwt_secret();
        assert_eq!(secret.len(), 64);
    }

    #[test]
    fn test_generate_uuid() {
        let uuid = SecretGenerator::generate_uuid();
        assert!(uuid.contains('-'));
    }

    #[test]
    fn test_env_manager_auto_generate() {
        let mut manager = EnvManager::new();
        let mut config = HashMap::new();
        config.insert("JWT_SECRET".to_string(), "auto-generate".to_string());
        config.insert("CUSTOM_VAR".to_string(), "custom_value".to_string());

        manager.process_env_vars(&config);

        assert!(manager.get_env_vars().contains_key("JWT_SECRET"));
        assert_eq!(manager.get_env_vars().get("CUSTOM_VAR").unwrap(), "custom_value");
        assert!(manager.get_secrets().contains_key("JWT_SECRET"));
    }

    #[test]
    fn test_connection_string_postgres() {
        let manager = EnvManager::new();
        let conn_str = manager.generate_connection_string(
            "postgres",
            "localhost",
            5432,
            "mydb",
            "user",
            "pass",
        );
        assert_eq!(conn_str, "postgresql://user:pass@localhost:5432/mydb");
    }
}
