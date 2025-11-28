use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{Emitter, State};
use futures::StreamExt;
use zeroconfig::config::ZeroConfig;
use zeroconfig::core::Engine;
use zeroconfig::runtime::ContainerRuntimeManager;

/// Validate shell command to prevent command injection
fn validate_shell_command(shell: &str) -> Result<(), String> {
    let allowed_shells = ["sh", "bash", "zsh", "fish", "ash", "dash"];
    if !allowed_shells.contains(&shell) {
        return Err(format!("Invalid shell '{}'. Allowed: {:?}", shell, allowed_shells));
    }
    Ok(())
}

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
    network: NetworkStats,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MemoryStats {
    percentage: f64,
    usage: u64,
    limit: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkStats {
    rx: u64,
    tx: u64,
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

    // Try to get stats, but don't fail if we can't
    let stats_map = engine.get_all_stats().await.ok().unwrap_or_default()
        .into_iter()
        .collect::<HashMap<_, _>>();

    let mut services = Vec::new();

    for container in containers {
        let name = container.names.as_ref()
            .and_then(|n| n.first())
            .map(|n| n.trim_start_matches('/'))
            .unwrap_or("unknown")
            .to_string();
        
        let image = container.image.unwrap_or_default();
        let status = container.status.unwrap_or_default();
        
        // Extract port
        let port = container.ports.as_ref()
            .and_then(|p| p.iter().find(|port| port.public_port.is_some()))
            .map(|p| p.public_port.unwrap_or(0));

        let stats = stats_map.get(&name).map(|stat| {
             // Calculate CPU percentage
            let cpu_delta = stat.cpu_stats.cpu_usage.total_usage as f64
                - stat.precpu_stats.cpu_usage.total_usage as f64;
            let system_delta = stat.cpu_stats.system_cpu_usage.unwrap_or(0) as f64
                - stat.precpu_stats.system_cpu_usage.unwrap_or(0) as f64;

            let cpu_percent = if system_delta > 0.0 && cpu_delta > 0.0 {
                let num_cpus = stat.cpu_stats.online_cpus.unwrap_or(1) as f64;
                (cpu_delta / system_delta) * num_cpus * 100.0
            } else {
                0.0
            };

            // Calculate Memory percentage
            let memory_usage = stat.memory_stats.usage.unwrap_or(0);
            let memory_limit = stat.memory_stats.limit.unwrap_or(0);
            let memory_percent = if memory_limit > 0 {
                (memory_usage as f64 / memory_limit as f64) * 100.0
            } else {
                0.0
            };

            // Network I/O
            let mut rx = 0;
            let mut tx = 0;
            if let Some(networks) = &stat.networks {
                for net in networks.values() {
                    rx += net.rx_bytes;
                    tx += net.tx_bytes;
                }
            }

            ServiceStats {
                cpu: cpu_percent,
                memory: MemoryStats {
                    percentage: memory_percent,
                    usage: memory_usage,
                    limit: memory_limit,
                },
                network: NetworkStats {
                    rx,
                    tx,
                },
            }
        });

        services.push(ServiceInfo {
            name,
            image,
            status,
            port,
            stats,
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
async fn start_cloud_emulator(provider: String) -> Result<String, String> {
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
async fn stop_cloud_emulator(provider: String) -> Result<String, String> {
    use zeroconfig::cloud::CloudEmulator;
    
    let emulator = CloudEmulator::new(provider.clone()).await
        .map_err(|e| format!("Failed to create emulator: {}", e))?;
        
    emulator.stop().await
        .map_err(|e| format!("Failed to stop emulator: {}", e))?;
        
    Ok(format!("{} emulator stopped", provider))
}

#[tauri::command]
async fn get_cloud_status(provider: String) -> Result<String, String> {
    use zeroconfig::cloud::CloudEmulator;
    
    let emulator = CloudEmulator::new(provider.clone()).await
        .map_err(|e| format!("Failed to create emulator: {}", e))?;
        
    let status = emulator.is_running().await
        .map_err(|e| format!("Failed to get status: {}", e))?;
        
    Ok(if status { "Running".to_string() } else { "Stopped".to_string() })
}

// Runtime checks
#[derive(Debug, Serialize, Deserialize)]
pub struct ContainerRuntimeStatus {
    name: String,
    installed: bool,
    running: bool,
    version: Option<String>,
    is_preferred: bool,
}

#[tauri::command]
async fn detect_all_runtimes() -> Result<Vec<ContainerRuntimeStatus>, String> {
    let mut manager = ContainerRuntimeManager::new();
    manager.detect_runtimes().await.map_err(|e| e.to_string())?;
    
    use zeroconfig::runtime::ContainerRuntime;
    
    let all_runtimes = ContainerRuntime::all();
    let preferred = manager.get_preferred_runtime().ok();
    
    // Run checks in parallel
    let futures = all_runtimes.iter().map(|rt| {
        let manager_ref = &manager;
        async move {
            let status = manager_ref.get_runtime_status(*rt).await;
            ContainerRuntimeStatus {
                name: rt.name().to_string(),
                installed: status.installed,
                running: status.running,
                version: status.version,
                is_preferred: preferred == Some(*rt),
            }
        }
    });
    
    let statuses = futures::future::join_all(futures).await;
    
    Ok(statuses)
}

// Legacy checks for compatibility
#[tauri::command]
async fn check_docker_status() -> Result<String, String> {
    let manager = ContainerRuntimeManager::new();
    let status = manager.get_runtime_status(zeroconfig::runtime::ContainerRuntime::Docker).await;
    if status.running {
        Ok(status.version.unwrap_or_default())
    } else {
        Err("Docker not running".to_string())
    }
}

#[tauri::command]
async fn check_podman_status() -> Result<String, String> {
    let manager = ContainerRuntimeManager::new();
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

#[tauri::command]
async fn get_services_stats(project_path: String) -> Result<HashMap<String, ServiceStats>, String> {
    let engine = get_engine(&project_path).await?;
    let stats = engine.get_all_stats().await
        .map_err(|e| format!("Failed to get stats: {}", e))?;

    let mut result = HashMap::new();

    for (name, stat) in stats {
        // Calculate CPU percentage
        let cpu_delta = stat.cpu_stats.cpu_usage.total_usage as f64
            - stat.precpu_stats.cpu_usage.total_usage as f64;
        let system_delta = stat.cpu_stats.system_cpu_usage.unwrap_or(0) as f64
            - stat.precpu_stats.system_cpu_usage.unwrap_or(0) as f64;

        let cpu_percent = if system_delta > 0.0 && cpu_delta > 0.0 {
            let num_cpus = stat.cpu_stats.online_cpus.unwrap_or(1) as f64;
            (cpu_delta / system_delta) * num_cpus * 100.0
        } else {
            0.0
        };

        // Calculate Memory percentage
        let memory_usage = stat.memory_stats.usage.unwrap_or(0);
        let memory_limit = stat.memory_stats.limit.unwrap_or(0);
        let memory_percent = if memory_limit > 0 {
            (memory_usage as f64 / memory_limit as f64) * 100.0
        } else {
            0.0
        };

        // Network I/O
        let mut rx = 0;
        let mut tx = 0;
        if let Some(networks) = stat.networks {
            for net in networks.values() {
                rx += net.rx_bytes;
                tx += net.tx_bytes;
            }
        }

        result.insert(name, ServiceStats {
            cpu: cpu_percent,
            memory: MemoryStats {
                percentage: memory_percent,
                usage: memory_usage,
                limit: memory_limit,
            },
            network: NetworkStats {
                rx,
                tx,
            },
        });
    }

    Ok(result)
}

// Missing commands: check_minikube_status
#[tauri::command]
async fn check_minikube_status() -> Result<String, String> {
     let manager = ContainerRuntimeManager::new();
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
    if let Some(handle) = state.handles.lock().map_err(|_| "Failed to lock mutex".to_string())?.remove(&service_name) {
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

    state.handles.lock().map_err(|_| "Failed to lock mutex".to_string())?.insert(service_name, handle.abort_handle());
    Ok(())
}

#[tauri::command]
async fn stop_log_stream(
    state: State<'_, LogStreamManager>,
    service_name: String,
) -> Result<(), String> {
    if let Some(handle) = state.handles.lock().map_err(|_| "Failed to lock mutex".to_string())?.remove(&service_name) {
        handle.abort();
    }
    Ok(())
}

#[tauri::command]
async fn open_terminal_window(service_name: String, shell: Option<String>) -> Result<(), String> {
    // Get container ID using docker ps command directly
    let output = std::process::Command::new("docker")
        .args(&["ps", "--filter", &format!("name={}", service_name), "--format", "{{.ID}}"])
        .output()
        .map_err(|e| format!("Failed to run docker ps: {}", e))?;
    
    if !output.status.success() {
        return Err("Failed to get container ID".to_string());
    }
    
    let container_id = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if container_id.is_empty() {
        return Err(format!("Container {} not found or not running", service_name));
    }
    
    let shell_cmd = shell.unwrap_or_else(|| "sh".to_string());
    
    // Validate shell command to prevent injection
    validate_shell_command(&shell_cmd)?;
    
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
            get_services_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}