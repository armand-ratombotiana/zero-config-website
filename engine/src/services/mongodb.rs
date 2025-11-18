/// MongoDB service configuration and helpers

pub struct MongoDBService;

impl MongoDBService {
    pub fn default_image(version: &str) -> String {
        format!("mongo:{}", version)
    }

    pub fn default_port() -> u16 {
        27017
    }

    pub fn default_env_vars(database: &str, user: &str, password: &str) -> Vec<String> {
        vec![
            format!("MONGO_INITDB_DATABASE={}", database),
            format!("MONGO_INITDB_ROOT_USERNAME={}", user),
            format!("MONGO_INITDB_ROOT_PASSWORD={}", password),
        ]
    }

    pub fn connection_string(host: &str, port: u16, database: &str, user: &str, password: &str) -> String {
        format!("mongodb://{}:{}@{}:{}/{}", user, password, host, port, database)
    }

    pub fn health_check_command() -> Vec<String> {
        vec![
            "mongosh".to_string(),
            "--eval".to_string(),
            "db.adminCommand('ping')".to_string(),
        ]
    }
}
