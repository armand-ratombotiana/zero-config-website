/// Redis service configuration and helpers

pub struct RedisService;

impl RedisService {
    pub fn default_image(version: &str) -> String {
        format!("redis:{}", version)
    }

    pub fn default_port() -> u16 {
        6379
    }

    pub fn default_env_vars() -> Vec<String> {
        vec![]
    }

    pub fn connection_string(host: &str, port: u16) -> String {
        format!("redis://{}:{}", host, port)
    }

    pub fn health_check_command() -> Vec<String> {
        vec![
            "redis-cli".to_string(),
            "ping".to_string(),
        ]
    }
}
