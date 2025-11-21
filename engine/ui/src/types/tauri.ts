export interface TauriServiceInfo {
    name: string;
    image: string;
    status: string;
    port?: number;
}

export interface TauriProjectConfig {
    path: string;
    services: TauriServiceInfo[];
}

export interface TauriCommandResult {
    success: boolean;
    message: string;
    data?: any;
}
