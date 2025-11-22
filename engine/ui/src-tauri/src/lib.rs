use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{Emitter, Manager, State};
use futures::StreamExt;
use zeroconfig::config::ZeroConfig;
use zeroconfig::core::Engine;
use zeroconfig::runtime::ContainerRuntimeManager;

struct LogStreamManager {
    handles: Mutex<HashMap<String, tokio::task::AbortHandle>>,
}

impl LogStreamManager {
    fn new() -> Self {
        Self {
            handles: Mutex::new(HashMap::new()),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServiceInfo {
    name: String,
    image: String,
    status: String,
    port: Option<u16>,
    stats: Option<ServiceStats>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServiceStats {
    cpu: f64,
    memory: MemoryStats,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MemoryStats {
    percentage: f64,
    usage: u64,
}

/// Helper to get initialized engine
async fn get_engine(project_path: &str) -> Result<Engine, String> {
    let config = ZeroConfig::discover_in(project_path)
        .map_err(|e| format!("Failed to discover config: {}", e))?
        .ok_or_else(|| "No zero.yml found".to_string())?;

    config.validate().map_err(|e| format!("Invalid config: {}", e))?;

    let project_name = config.metadata.name
        .clone()
        .unwrap_or_else(|| "zeroconfig-project".to_string());

    Engine::new(project_name, config).await
        .map_err(|e| format!("Failed to initialize engine: {}", e))
}

#[tauri::command]
async fn init_project(project_path: String, template: Option<String>) -> Result<String, String> {
    // For init, we still use the CLI logic or library logic.
    // Since init creates files, we can just use the library command logic if we exposed it,
    // or reimplement it here.
    // Reimplementing is safer as we don't want to print to stdout.
    
    let normalized_path = project_path.replace("\\", "/");
    let path = std::path::Path::new(&normalized_path);

    if !path.exists() {
        std::fs::create_dir_all(&path)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // We can use the zeroconfig::commands::init logic but adapted.
    // Or just write the file directly.
    
    let template_str = match template.as_deref() {
        Some("node") => include_str!("../../../templates/node.yml"),
        Some("python") => include_str!("../../../templates/python.yml"),
        Some("rust") => include_str!("../../../templates/rust.yml"),
        Some("go") => include_str!("../../../templates/go.yml"),
        Some("fullstack") => include_str!("../../../templates/fullstack.yml"),
        _ => include_str!("../../../templates/default.yml"),
    };

    let config_path = path.join("zero.yml");
    std::fs::write(&config_path, template_str)
        .map_err(|e| format!("Failed to write zero.yml: {}", e))?;

    Ok(format!("Project initialized at {}", normalized_path))
}

#[tauri::command]
async fn list_services(project_path: String) -> Result<Vec<ServiceInfo>, String> {
    let engine = get_engine(&project_path).await?;
    let containers = engine.list_services().await
        .map_err(|e| format!("Failed to list services: {}", e))?;

    let mut services = Vec::new();

    for container in containers {
        let name = container.names.as_ref()
            .and_then(|n| n.first())
            .map(|n| n.trim_start_matches('/'))
            .unwrap_or("unknown")
            .to_string();
        
        // Filter by project name (simple heuristic)
        // The engine already filters by project name in list_containers if we used the orchestrator correctly.
        // But let's be safe.
        
        let image = container.image.unwrap_or_default();
        let status = container.status.unwrap_or_default();
        
        // Extract port
        let port = container.ports.as_ref()
            .and_then(|p| p.iter().find(|port| port.public_port.is_some()))
            .map(|p| p.public_port.unwrap());

        services.push(ServiceInfo {
            name,
            image,
            status,
            port,
            stats: None, // We could fetch stats here if we wanted
        });
    }

    Ok(services)
}

#[tauri::command]
async fn start_services(project_path: String) -> Result<String, String> {
    let mut engine = get_engine(&project_path).await?;
    engine.start().await.map_err(|e| format!("Failed to start services: {}", e))?;
    Ok("Services started successfully".to_string())
}

#[tauri::command]
async fn stop_services(project_path: String) -> Result<String, String> {
    let engine = get_engine(&project_path).await?;
    engine.stop().await.map_err(|e| format!("Failed to stop services: {}", e))?;
    Ok("Services stopped successfully".to_string())
}

#[tauri::command]
async fn start_service(project_path: String, service_name: String) -> Result<String, String> {
    let mut engine = get_engine(&project_path).await?;
    engine.start_service(&service_name).await
        .map_err(|e| format!("Failed to start service {}: {}", service_name, e))?;
    Ok(format!("Service {} started", service_name))
}

#[tauri::command]
async fn stop_service(project_path: String, service_name: String) -> Result<String, String> {
    let engine = get_engine(&project_path).await?;
    engine.stop_service(&service_name).await
        .map_err(|e| format!("Failed to stop service {}: {}", service_name, e))?;
    Ok(format!("Service {} stopped", service_name))
}

#[tauri::command]
async fn restart_service(project_path: String, service_name: String) -> Result<String, String> {
    let engine = get_engine(&project_path).await?;
    engine.restart_service(&service_name).await
        .map_err(|e| format!("Failed to restart service {}: {}", service_name, e))?;
    Ok(format!("Service {} restarted", service_name))
}

#[tauri::command]
async fn get_service_logs(project_path: String, service_name: String, tail: Option<usize>) -> Result<String, String> {
    let engine = get_engine(&project_path).await?;
    let logs = engine.get_logs_as_string(&service_name, tail.unwrap_or(100)).await
        .map_err(|e| format!("Failed to get logs: {}", e))?;
    Ok(logs)
}

// Cloud commands - reuse existing logic or implement similar to above
#[tauri::command]
async fn start_cloud_emulator(project_path: String, provider: String) -> Result<String, String> {
    // Cloud emulator logic is in zeroconfig::cloud
    // We can use it directly
    use zeroconfig::cloud::CloudEmulator;
    
    let emulator = CloudEmulator::new(provider.clone()).await
        .map_err(|e| format!("Failed to create emulator: {}", e))?;
        
    emulator.start().await
        .map_err(|e| format!("Failed to start emulator: {}", e))?;
        
    Ok(format!("{} emulator started", provider))
}

#[tauri::command]
async fn stop_cloud_emulator(project_path: String, provider: String) -> Result<String, String> {
    use zeroconfig::cloud::CloudEmulator;
    
    let emulator = CloudEmulator::new(provider.clone()).await
        .map_err(|e| format!("Failed to create emulator: {}", e))?;
        
    emulator.stop().await
        .map_err(|e| format!("Failed to stop emulator: {}", e))?;
        
    Ok(format!("{} emulator stopped", provider))
}

#[tauri::command]
async fn get_cloud_status(project_path: String, provider: String) -> Result<String, String> {
    use zeroconfig::cloud::CloudEmulator;
    
    let emulator = CloudEmulator::new(provider.clone()).await
        .map_err(|e| format!("Failed to create emulator: {}", e))?;
        
    let status = emulator.status().await
        .map_err(|e| format!("Failed to get status: {}", e))?;
        
    Ok(if status { "Running".to_string() } else { "Stopped".to_string() })
}

// Runtime checks
#[derive(Debug, Serialize, Deserialize)]
pub struct ContainerRuntimeStatus {
    name: String,
    installed: boolean,
    running: boolean,
    version: Option<String>,
    is_preferred: boolean,
}

// Use bool instead of boolean (typo fix)
#[derive(Debug, Serialize, Deserialize)]
pub struct ContainerRuntimeStatusFixed {
    name: String,
    installed: bool,
    running: bool,
    version: Option<String>,
    is_preferred: bool,
}

#[tauri::command]
async fn detect_all_runtimes() -> Result<Vec<ContainerRuntimeStatusFixed>, String> {
    let mut manager = ContainerRuntimeManager::new();
    manager.detect_runtimes().await.map_err(|e| e.to_string())?;
    
    let available = manager.get_available_runtimes();
    let mut statuses = Vec::new();
    
    // We need to manually construct the status list based on what the manager found
    // The manager doesn't expose a "get_all_statuses" method that returns exactly what we want
    // So we iterate over known runtimes
    
    use zeroconfig::runtime::ContainerRuntime;
    
    let all_runtimes = vec![
        ContainerRuntime::Docker,
        ContainerRuntime::Podman,
        ContainerRuntime::Minikube,
        ContainerRuntime::Nerdctl,
        ContainerRuntime::Colima,
    ];
    
    let preferred = manager.get_preferred_runtime().ok();
    
    for rt in all_runtimes {
        let status = manager.get_runtime_status(rt).await;
        statuses.push(ContainerRuntimeStatusFixed {
            name: rt.name().to_string(),
            installed: status.installed,
            running: status.running,
            version: status.version,
            is_preferred: preferred == Some(rt),
        });
    }
    
    Ok(statuses)
}

// Legacy checks for compatibility
#[tauri::command]
async fn check_docker_status() -> Result<String, String> {
    let mut manager = ContainerRuntimeManager::new();
    let status = manager.get_runtime_status(zeroconfig::runtime::ContainerRuntime::Docker).await;
    if status.running {
        Ok(status.version.unwrap_or_default())
    } else {
        Err("Docker not running".to_string())
    }
}

#[tauri::command]
async fn check_podman_status() -> Result<String, String> {
    let mut manager = ContainerRuntimeManager::new();
    let status = manager.get_runtime_status(zeroconfig::runtime::ContainerRuntime::Podman).await;
    if status.running {
        Ok(status.version.unwrap_or_default())
    } else {
        Err("Podman not running".to_string())
    }
}

// Config commands
#[tauri::command]
async fn load_template(template_name: String) -> Result<String, String> {
    let template_str = match template_name.as_str() {
        "node" => include_str!("../../../templates/node.yml"),
        "python" => include_str!("../../../templates/python.yml"),
        "rust" => include_str!("../../../templates/rust.yml"),
        "go" => include_str!("../../../templates/go.yml"),
        "fullstack" => include_str!("../../../templates/fullstack.yml"),
        _ => include_str!("../../../templates/default.yml"),
    };
    Ok(template_str.to_string())
}

#[tauri::command]
async fn list_templates() -> Result<Vec<String>, String> {
    Ok(vec![
        "default".to_string(),
        "node".to_string(),
        "python".to_string(),
        "rust".to_string(),
        "go".to_string(),
        "fullstack".to_string(),
    ])
}

#[tauri::command]
async fn save_config(project_path: String, config_content: String) -> Result<String, String> {
    let config_path = std::path::Path::new(&project_path).join("zero.yml");
    std::fs::write(&config_path, config_content)
        .map_err(|e| format!("Failed to save configuration: {}", e))?;
    Ok(format!("Configuration saved to {:?}", config_path))
}

#[tauri::command]
async fn load_config(project_path: String) -> Result<String, String> {
    let config_path = std::path::Path::new(&project_path).join("zero.yml");
    std::fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to load configuration: {}", e))
}

#[tauri::command]
async fn validate_config(config_content: String) -> Result<String, String> {
    ZeroConfig::from_str(&config_content)
        .map(|_| "Configuration is valid".to_string())
        .map_err(|e| format!("Invalid YAML: {}", e))
}

// Generators - reuse library
#[tauri::command]
async fn generate_dockerfile(project_path: String) -> Result<String, String> {
    let config = ZeroConfig::discover_in(&project_path)
        .map_err(|e| e.to_string())?
        .ok_or("No config found")?;
    
    zeroconfig::generators::dockerfile::generate(&config, std::path::Path::new(&project_path))
        .map_err(|e| e.to_string())?;
    Ok("Dockerfile generated".to_string())
}

#[tauri::command]
async fn generate_compose(project_path: String) -> Result<String, String> {
    let config = ZeroConfig::discover_in(&project_path)
        .map_err(|e| e.to_string())?
        .ok_or("No config found")?;
    
    zeroconfig::generators::compose::generate(&config, std::path::Path::new(&project_path))
        .map_err(|e| e.to_string())?;
    Ok("docker-compose.yml generated".to_string())
}

#[tauri::command]
async fn generate_env_file(project_path: String) -> Result<String, String> {
    let config = ZeroConfig::discover_in(&project_path)
        .map_err(|e| e.to_string())?
        .ok_or("No config found")?;
    
    zeroconfig::generators::envfile::generate(&config, std::path::Path::new(&project_path))
        .map_err(|e| e.to_string())?;
    Ok(".env generated".to_string())
}

#[tauri::command]
async fn generate_github_actions(project_path: String) -> Result<String, String> {
    let config = ZeroConfig::discover_in(&project_path)
        .map_err(|e| e.to_string())?
        .ok_or("No config found")?;
    
    zeroconfig::generators::github_actions::generate(&config, std::path::Path::new(&project_path))
        .map_err(|e| e.to_string())?;
    Ok("GitHub Actions generated".to_string())
}

#[tauri::command]
async fn generate_all_configs(project_path: String) -> Result<String, String> {
    let config = ZeroConfig::discover_in(&project_path)
        .map_err(|e| e.to_string())?
        .ok_or("No config found")?;
    
    zeroconfig::generators::generate_all(&config, std::path::Path::new(&project_path))
        .map_err(|e| e.to_string())?;
    Ok("All configs generated".to_string())
}

// Missing commands: check_minikube_status
#[tauri::command]
async fn check_minikube_status() -> Result<String, String> {
     let mut manager = ContainerRuntimeManager::new();
    let status = manager.get_runtime_status(zeroconfig::runtime::ContainerRuntime::Minikube).await;
    if status.running {
        Ok(status.version.unwrap_or_default())
    } else {
        Err("Minikube not running".to_string())
    }
}

#[tauri::command]
async fn start_log_stream(
    app: tauri::AppHandle,
    state: State<'_, LogStreamManager>,
    project_path: String,
    service_name: String,
) -> Result<(), String> {
    // Stop existing stream if any
    if let Some(handle) = state.handles.lock().unwrap().remove(&service_name) {
        handle.abort();
    }

    let engine = get_engine(&project_path).await?;
    let mut stream = engine.stream_logs(&service_name, 100).await
        .map_err(|e| format!("Failed to start log stream: {}", e))?;

    let service_name_clone = service_name.clone();
    let handle = tokio::spawn(async move {
        while let Some(log_result) = stream.next().await {
            match log_result {
                Ok(log) => {
                    let _ = app.emit("log-event", serde_json::json!({
                        "service": service_name_clone,
                        "line": log
                    }));
                }
                Err(_) => break,
            }
        }
    });

    state.handles.lock().unwrap().insert(service_name, handle.abort_handle());
    Ok(())
}

#[tauri::command]
async fn stop_log_stream(
    state: State<'_, LogStreamManager>,
    service_name: String,
) -> Result<(), String> {
    if let Some(handle) = state.handles.lock().unwrap().remove(&service_name) {
        handle.abort();
    }
    Ok(())
}

#[tauri::command]
async fn open_terminal_window(project_path: String, service_name: String, shell: Option<String>) -> Result<(), String> {
    let engine = get_engine(&project_path).await?;
    let container_id = engine.orchestrator.get_container_id(&service_name).await
        .map_err(|e| format!("Failed to get container ID: {}", e))?;
    
    let shell_cmd = shell.unwrap_or_else(|| "sh".to_string());
    
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(&["/C", "start", "cmd", "/K", &format!("docker exec -it {} {}", container_id, shell_cmd)])
            .spawn()
            .map_err(|e| format!("Failed to open terminal: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("osascript")
            .args(&["-e", &format!("tell application \"Terminal\" to do script \"docker exec -it {} {}\"", container_id, shell_cmd)])
            .spawn()
            .map_err(|e| format!("Failed to open terminal: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try common terminal emulators
        let terminals = ["gnome-terminal", "konsole", "xterm", "rxvt"];
        let mut spawned = false;
        
        for term in terminals {
            let args = match term {
                "gnome-terminal" => vec!["--", "docker", "exec", "-it", &container_id, &shell_cmd],
                "konsole" => vec!["-e", "docker", "exec", "-it", &container_id, &shell_cmd],
                _ => vec!["-e", &format!("docker exec -it {} {}", container_id, shell_cmd)],
            };
            
            if std::process::Command::new(term).args(&args).spawn().is_ok() {
                spawned = true;
                break;
            }
        }
        
        if !spawned {
            return Err("No supported terminal emulator found".to_string());
        }
    }

    Ok(())
}

/// Generate Dockerfile
#[tauri::command]
async fn generate_dockerfile(project_path: String) -> Result<String, String> {
    let config = ZeroConfig::discover_in(&project_path)
        .map_err(|e| format!("Failed to discover config: {}", e))?
        .ok_or_else(|| "No zero.yml found".to_string())?;
    
    let output_dir = PathBuf::from(&project_path);
    zeroconfig::generators::dockerfile::generate(&config, &output_dir)
        .map_err(|e| format!("Failed to generate Dockerfile: {}", e))?;
    
    Ok("Dockerfile generated successfully".to_string())
}

/// Generate docker-compose.yml
#[tauri::command]
async fn generate_compose(project_path: String) -> Result<String, String> {
    let config = ZeroConfig::discover_in(&project_path)
        .map_err(|e| format!("Failed to discover config: {}", e))?
        .ok_or_else(|| "No zero.yml found".to_string())?;
    
    let output_dir = PathBuf::from(&project_path);
    zeroconfig::generators::compose::generate(&config, &output_dir)
        .map_err(|e| format!("Failed to generate docker-compose.yml: {}", e))?;
    
    Ok("docker-compose.yml generated successfully".to_string())
}

/// Generate .env file
#[tauri::command]
async fn generate_env_file(project_path: String) -> Result<String, String> {
    let config = ZeroConfig::discover_in(&project_path)
        .map_err(|e| format!("Failed to discover config: {}", e))?
        .ok_or_else(|| "No zero.yml found".to_string())?;
    
    let output_dir = PathBuf::from(&project_path);
    zeroconfig::generators::envfile::generate(&config, &output_dir)
        .map_err(|e| format!("Failed to generate .env file: {}", e))?;
    
    Ok(".env file generated successfully".to_string())
}

/// Generate GitHub Actions workflow
#[tauri::command]
async fn generate_github_actions(project_path: String) -> Result<String, String> {
    let config = ZeroConfig::discover_in(&project_path)
        .map_err(|e| format!("Failed to discover config: {}", e))?
        .ok_or_else(|| "No zero.yml found".to_string())?;
    
    let output_dir = PathBuf::from(&project_path);
    zeroconfig::generators::github_actions::generate(&config, &output_dir)
        .map_err(|e| format!("Failed to generate GitHub Actions workflow: {}", e))?;
    
    Ok("GitHub Actions workflow generated successfully".to_string())
}

/// Generate all configuration files
#[tauri::command]
async fn generate_all_configs(project_path: String) -> Result<String, String> {
    let config = ZeroConfig::discover_in(&project_path)
        .map_err(|e| format!("Failed to discover config: {}", e))?
        .ok_or_else(|| "No zero.yml found".to_string())?;
    
    let output_dir = PathBuf::from(&project_path);
    zeroconfig::generators::generate_all(&config, &output_dir)
        .map_err(|e| format!("Failed to generate configs: {}", e))?;
    
    Ok("All configuration files generated successfully".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(LogStreamManager::new())
        .invoke_handler(tauri::generate_handler![
            init_project,
            list_services,
            start_services,
            stop_services,
            start_service,
            stop_service,
            restart_service,
            get_service_logs,
            start_log_stream,
            stop_log_stream,
            open_terminal_window,
            start_cloud_emulator,
            stop_cloud_emulator,
            get_cloud_status,
            check_docker_status,
            check_podman_status,
            check_minikube_status,
            detect_all_runtimes,
            load_template,
            list_templates,
            save_config,
            load_config,
            validate_config,
            generate_dockerfile,
            generate_compose,
            generate_env_file,
            generate_github_actions,
            generate_all_configs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}