import { invoke } from '@tauri-apps/api/core';

/**
 * Tauri API Service
 * Provides type-safe wrappers for all Tauri commands
 */

export const tauriApi = {
  // Project Management
  async initProject(projectPath: string): Promise<string> {
    try {
      return await invoke<string>('init_project', { projectPath });
    } catch (error) {
      throw new Error(`Failed to initialize project: ${error}`);
    }
  },

  // Service Management
  async listServices(projectPath: string): Promise<string> {
    try {
      return await invoke<string>('list_services', { projectPath });
    } catch (error) {
      throw new Error(`Failed to list services: ${error}`);
    }
  },

  async startServices(projectPath: string): Promise<string> {
    try {
      return await invoke<string>('start_services', { projectPath });
    } catch (error) {
      throw new Error(`Failed to start services: ${error}`);
    }
  },

  async stopServices(projectPath: string): Promise<string> {
    try {
      return await invoke<string>('stop_services', { projectPath });
    } catch (error) {
      throw new Error(`Failed to stop services: ${error}`);
    }
  },

  async startService(projectPath: string, serviceName: string): Promise<string> {
    try {
      return await invoke<string>('start_service', { projectPath, serviceName });
    } catch (error) {
      throw new Error(`Failed to start service ${serviceName}: ${error}`);
    }
  },

  async stopService(projectPath: string, serviceName: string): Promise<string> {
    try {
      return await invoke<string>('stop_service', { projectPath, serviceName });
    } catch (error) {
      throw new Error(`Failed to stop service ${serviceName}: ${error}`);
    }
  },

  async restartService(projectPath: string, serviceName: string): Promise<string> {
    try {
      return await invoke<string>('restart_service', { projectPath, serviceName });
    } catch (error) {
      throw new Error(`Failed to restart service ${serviceName}: ${error}`);
    }
  },

  // Logs
  async getServiceLogs(projectPath: string, serviceName: string, tail?: number): Promise<string> {
    try {
      return await invoke<string>('get_service_logs', { projectPath, serviceName, tail });
    } catch (error) {
      throw new Error(`Failed to get logs for ${serviceName}: ${error}`);
    }
  },

  // Cloud Emulators
  async startCloudEmulator(projectPath: string, provider: string): Promise<string> {
    try {
      return await invoke<string>('start_cloud_emulator', { projectPath, provider });
    } catch (error) {
      throw new Error(`Failed to start cloud emulator ${provider}: ${error}`);
    }
  },

  async stopCloudEmulator(projectPath: string, provider: string): Promise<string> {
    try {
      return await invoke<string>('stop_cloud_emulator', { projectPath, provider });
    } catch (error) {
      throw new Error(`Failed to stop cloud emulator ${provider}: ${error}`);
    }
  },

  async getCloudStatus(projectPath: string, provider: string): Promise<string> {
    try {
      return await invoke<string>('get_cloud_status', { projectPath, provider });
    } catch (error) {
      throw new Error(`Failed to get cloud status for ${provider}: ${error}`);
    }
  },

  // System Health
  async checkDockerStatus(): Promise<string> {
    try {
      return await invoke<string>('check_docker_status');
    } catch (error) {
      throw new Error(`Failed to check Docker status: ${error}`);
    }
  },

  // Configuration Management
  async loadTemplate(templateName: string): Promise<string> {
    try {
      return await invoke<string>('load_template', { templateName });
    } catch (error) {
      throw new Error(`Failed to load template ${templateName}: ${error}`);
    }
  },

  async listTemplates(): Promise<string[]> {
    try {
      return await invoke<string[]>('list_templates');
    } catch (error) {
      throw new Error(`Failed to list templates: ${error}`);
    }
  },

  async saveConfig(projectPath: string, configContent: string): Promise<string> {
    try {
      return await invoke<string>('save_config', { projectPath, configContent });
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error}`);
    }
  },

  async loadConfig(projectPath: string): Promise<string> {
    try {
      return await invoke<string>('load_config', { projectPath });
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error}`);
    }
  },

  async validateConfig(configContent: string): Promise<string> {
    try {
      return await invoke<string>('validate_config', { configContent });
    } catch (error) {
      throw new Error(`Failed to validate configuration: ${error}`);
    }
  },

  async generateDockerfile(projectPath: string): Promise<string> {
    try {
      return await invoke<string>('generate_dockerfile', { projectPath });
    } catch (error) {
      throw new Error(`Failed to generate Dockerfile: ${error}`);
    }
  },

  async generateCompose(projectPath: string): Promise<string> {
    try {
      return await invoke<string>('generate_compose', { projectPath });
    } catch (error) {
      throw new Error(`Failed to generate docker-compose.yml: ${error}`);
    }
  },

  async generateEnvFile(projectPath: string): Promise<string> {
    try {
      return await invoke<string>('generate_env_file', { projectPath });
    } catch (error) {
      throw new Error(`Failed to generate .env file: ${error}`);
    }
  },

  async generateGithubActions(projectPath: string): Promise<string> {
    try {
      return await invoke<string>('generate_github_actions', { projectPath });
    } catch (error) {
      throw new Error(`Failed to generate GitHub Actions workflow: ${error}`);
    }
  },

  async generateAllConfigs(projectPath: string): Promise<string> {
    try {
      return await invoke<string>('generate_all_configs', { projectPath });
    } catch (error) {
      throw new Error(`Failed to generate all configurations: ${error}`);
    }
  },
};