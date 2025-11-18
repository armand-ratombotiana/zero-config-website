// Azurite - Azure Storage Emulator

pub const DEFAULT_SERVICES: &[&str] = &[
    "blob",
    "queue",
    "table",
];

pub const DEFAULT_IMAGE: &str = "mcr.microsoft.com/azure-storage/azurite:latest";

// Azurite default ports
pub const BLOB_PORT: u16 = 10000;
pub const QUEUE_PORT: u16 = 10001;
pub const TABLE_PORT: u16 = 10002;

pub fn get_blob_endpoint() -> String {
    format!("http://127.0.0.1:{}", BLOB_PORT)
}

pub fn get_queue_endpoint() -> String {
    format!("http://127.0.0.1:{}", QUEUE_PORT)
}

pub fn get_table_endpoint() -> String {
    format!("http://127.0.0.1:{}", TABLE_PORT)
}

pub fn get_connection_string() -> String {
    format!(
        "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;\
        AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;\
        BlobEndpoint={}/devstoreaccount1;\
        QueueEndpoint={}/devstoreaccount1;\
        TableEndpoint={}/devstoreaccount1;",
        get_blob_endpoint(),
        get_queue_endpoint(),
        get_table_endpoint()
    )
}

pub fn get_azure_config_snippet() -> String {
    format!(
        r#"
# Azure Storage Configuration for Azurite
export AZURE_STORAGE_CONNECTION_STRING="{}"

# Or in your code:
# from azure.storage.blob import BlobServiceClient
# connection_string = "{}"
# blob_service_client = BlobServiceClient.from_connection_string(connection_string)

# Available endpoints:
# Blob Storage: {}
# Queue Storage: {}
# Table Storage: {}
"#,
        get_connection_string(),
        get_connection_string(),
        get_blob_endpoint(),
        get_queue_endpoint(),
        get_table_endpoint()
    )
}
