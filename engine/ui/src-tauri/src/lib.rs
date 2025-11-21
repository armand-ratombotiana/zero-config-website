use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct ServiceInfo {
    name: String,
    image: String,
    status: String,
    port: Option<u16>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectConfig {
    path: String,
    services: Vec<ServiceInfo>,
}

/// Get the path to the zeroconfig executable
fn get_zeroconfig_exe() -> Result<PathBuf, String> {
    #[cfg(target_os = "windows")]
    const EXE_NAME: &str = "zeroconfig.exe";
    #[cfg(not(target_os = "windows"))]
    const EXE_NAME: &str = "zeroconfig";

    #[cfg(debug_assertions)]
    {
        // In development, look for the executable in the engine target directory
        let debug_path = PathBuf::from("../../target/debug").join(EXE_NAME);
        let release_path = PathBuf::from("../../target/release").join(EXE_NAME);

        if release_path.exists() {
            return Ok(release_path);
        } else if debug_path.exists() {
            return Ok(debug_path);
        } else {
            return Err(format!(
                "ZeroConfig CLI not found. Please build it first with:\n  cd engine && cargo build --release\n\nLooked in:\n  {:?}\n  {:?}",
                debug_path, release_path
            ));
        }
    }
    #[cfg(not(debug_assertions))]
    {
        // In production, look in multiple locations
        let locations = vec![
            std::env::current_exe().ok().and_then(|p| p.parent().map(|p| p.join(EXE_NAME))),
            Some(PathBuf::from(".").join(EXE_NAME)),
            std::env::var("PATH").ok().and_then(|paths| {
                std::env::split_paths(&paths)
                    .find_map(|dir| {
                        let full_path = dir.join(EXE_NAME);
                        if full_path.exists() { Some(full_path) } else { None }
                    })
            }),
        ];

        for location in locations.into_iter().flatten() {
            if location.exists() {
                return Ok(location);
            }
        }

        Err(format!(
            "ZeroConfig CLI executable '{}' not found in PATH or application directory",
            EXE_NAME
        ))
    }
}

// ZeroConfig CLI Commands
#[tauri::command]
async fn init_project(project_path: String) -> Result<String, String> {
    let exe_path = get_zeroconfig_exe()?;
    let output = Command::new(&exe_path)
        .args(&["init"])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute zeroconfig at {:?}: {}", exe_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn list_services(project_path: String) -> Result<String, String> {
    let exe_path = get_zeroconfig_exe()?;
    let output = Command::new(&exe_path)
        .args(&["ps"])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute zeroconfig at {:?}: {}", exe_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn start_services(project_path: String) -> Result<String, String> {
    let exe_path = get_zeroconfig_exe()?;
    let output = Command::new(&exe_path)
        .args(&["up", "-d"])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute zeroconfig at {:?}: {}", exe_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn stop_services(project_path: String) -> Result<String, String> {
    let exe_path = get_zeroconfig_exe()?;
    let output = Command::new(&exe_path)
        .args(&["down"])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute zeroconfig at {:?}: {}", exe_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn start_service(project_path: String, service_name: String) -> Result<String, String> {
    let exe_path = get_zeroconfig_exe()?;
    let output = Command::new(&exe_path)
        .args(&["start", &service_name])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute zeroconfig at {:?}: {}", exe_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn stop_service(project_path: String, service_name: String) -> Result<String, String> {
    let exe_path = get_zeroconfig_exe()?;
    let output = Command::new(&exe_path)
        .args(&["stop", &service_name])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute zeroconfig at {:?}: {}", exe_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn restart_service(project_path: String, service_name: String) -> Result<String, String> {
    let exe_path = get_zeroconfig_exe()?;
    let output = Command::new(&exe_path)
        .args(&["restart", &service_name])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute zeroconfig at {:?}: {}", exe_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn get_service_logs(project_path: String, service_name: String, tail: Option<usize>) -> Result<String, String> {
    let exe_path = get_zeroconfig_exe()?;
    let tail_str = tail.unwrap_or(100).to_string();
    let output = Command::new(&exe_path)
        .args(&["logs", &service_name, "--tail", &tail_str])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute zeroconfig at {:?}: {}", exe_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn start_cloud_emulator(project_path: String, provider: String) -> Result<String, String> {
    let exe_path = get_zeroconfig_exe()?;
    let output = Command::new(&exe_path)
        .args(&["cloud", "start", &provider])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute zeroconfig at {:?}: {}", exe_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn stop_cloud_emulator(project_path: String, provider: String) -> Result<String, String> {
    let exe_path = get_zeroconfig_exe()?;
    let output = Command::new(&exe_path)
        .args(&["cloud", "stop", &provider])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute zeroconfig at {:?}: {}", exe_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn get_cloud_status(project_path: String, provider: String) -> Result<String, String> {
    let exe_path = get_zeroconfig_exe()?;
    let output = Command::new(&exe_path)
        .args(&["cloud", "status", &provider])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute zeroconfig at {:?}: {}", exe_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn check_docker_status() -> Result<String, String> {
    let exe_path = get_zeroconfig_exe()?;
    let output = Command::new(&exe_path)
        .args(&["doctor"])
        .output()
        .map_err(|e| format!("Failed to execute zeroconfig at {:?}: {}", exe_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

// Configuration Management Commands
#[tauri::command]
async fn load_template(template_name: String) -> Result<String, String> {
    let template_path = format!("../../templates/{}.yml", template_name);
    std::fs::read_to_string(&template_path)
        .map_err(|e| format!("Failed to load template {}: {}", template_name, e))
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
    // Basic YAML validation
    match serde_yaml::from_str::<serde_yaml::Value>(&config_content) {
        Ok(_) => Ok("Configuration is valid".to_string()),
        Err(e) => Err(format!("Invalid YAML: {}", e)),
    }
}

#[tauri::command]
async fn generate_dockerfile(project_path: String) -> Result<String, String> {
    let exe_path = get_zeroconfig_exe()?;
    let output = Command::new(&exe_path)
        .args(&["generate", "dockerfile"])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute zeroconfig at {:?}: {}", exe_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn generate_compose(project_path: String) -> Result<String, String> {
    let exe_path = get_zeroconfig_exe()?;
    let output = Command::new(&exe_path)
        .args(&["generate", "compose"])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute zeroconfig at {:?}: {}", exe_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn generate_env_file(project_path: String) -> Result<String, String> {
    let exe_path = get_zeroconfig_exe()?;
    let output = Command::new(&exe_path)
        .args(&["generate", "env"])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute zeroconfig at {:?}: {}", exe_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn generate_github_actions(project_path: String) -> Result<String, String> {
    let exe_path = get_zeroconfig_exe()?;
    let output = Command::new(&exe_path)
        .args(&["generate", "github-actions"])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute zeroconfig at {:?}: {}", exe_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn generate_all_configs(project_path: String) -> Result<String, String> {
    let exe_path = get_zeroconfig_exe()?;
    let output = Command::new(&exe_path)
        .args(&["generate", "all"])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to execute zeroconfig at {:?}: {}", exe_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            init_project,
            list_services,
            start_services,
            stop_services,
            start_service,
            stop_service,
            restart_service,
            get_service_logs,
            start_cloud_emulator,
            stop_cloud_emulator,
            get_cloud_status,
            check_docker_status,
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