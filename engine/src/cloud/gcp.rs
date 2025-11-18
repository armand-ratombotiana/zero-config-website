// GCP Cloud SDK Emulators

pub const DEFAULT_SERVICES: &[&str] = &[
    "firestore",
    "pubsub",
    "bigtable",
    "datastore",
    "spanner",
];

// Cloud SDK Emulator default ports
pub const FIRESTORE_PORT: u16 = 8080;
pub const PUBSUB_PORT: u16 = 8085;
pub const BIGTABLE_PORT: u16 = 8086;
pub const DATASTORE_PORT: u16 = 8081;
pub const SPANNER_PORT: u16 = 9010;

pub fn get_firestore_endpoint() -> String {
    format!("localhost:{}", FIRESTORE_PORT)
}

pub fn get_pubsub_endpoint() -> String {
    format!("localhost:{}", PUBSUB_PORT)
}

pub fn get_bigtable_endpoint() -> String {
    format!("localhost:{}", BIGTABLE_PORT)
}

pub fn get_datastore_endpoint() -> String {
    format!("localhost:{}", DATASTORE_PORT)
}

pub fn get_spanner_endpoint() -> String {
    format!("localhost:{}", SPANNER_PORT)
}

pub fn get_gcp_config_snippet() -> String {
    format!(
        r#"
# GCP Emulator Configuration
export FIRESTORE_EMULATOR_HOST={}
export PUBSUB_EMULATOR_HOST={}
export BIGTABLE_EMULATOR_HOST={}
export DATASTORE_EMULATOR_HOST={}
export SPANNER_EMULATOR_HOST={}
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Or in your code (Python):
# import os
# os.environ['FIRESTORE_EMULATOR_HOST'] = '{}'
# from google.cloud import firestore
# db = firestore.Client(project='test-project')

# Available endpoints:
# Firestore: {}
# Pub/Sub: {}
# Bigtable: {}
# Datastore: {}
# Spanner: {}
"#,
        get_firestore_endpoint(),
        get_pubsub_endpoint(),
        get_bigtable_endpoint(),
        get_datastore_endpoint(),
        get_spanner_endpoint(),
        get_firestore_endpoint(),
        get_firestore_endpoint(),
        get_pubsub_endpoint(),
        get_bigtable_endpoint(),
        get_datastore_endpoint(),
        get_spanner_endpoint()
    )
}
