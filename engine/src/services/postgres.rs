/// PostgreSQL service configuration and helpers

pub struct PostgresService;

impl PostgresService {
    pub fn default_image(version: &str) -> String {
        format!("postgres:{}", version)
    }

    pub fn default_port() -> u16 {
        5432
    }

    pub fn default_env_vars(database: &str, user: &str, password: &str) -> Vec<String> {
        vec![
            format!("POSTGRES_DB={}", database),
            format!("POSTGRES_USER={}", user),
            format!("POSTGRES_PASSWORD={}", password),
        ]
    }

    pub fn connection_string(host: &str, port: u16, database: &str, user: &str, password: &str) -> String {
        format!("postgresql://{}:{}@{}:{}/{}", user, password, host, port, database)
    }

    pub fn health_check_command() -> Vec<String> {
        vec![
            "pg_isready".to_string(),
            "-U".to_string(),
            "postgres".to_string(),
        ]
    }
}
