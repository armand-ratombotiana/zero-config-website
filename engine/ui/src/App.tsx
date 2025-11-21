import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { Services } from './pages/Services';
import { CloudEmulators } from './pages/CloudEmulators';
import { Monitoring } from './pages/Monitoring';
import { Logs } from './pages/Logs';
import { Configuration } from './pages/Configuration';
import { Settings } from './pages/Settings';
import CreateProjectModal from './components/modals/CreateProjectModal';
import { ToastContainer } from './components/notifications/ToastNotification';
import { useToast } from './hooks/useToast';
import { Service, ServiceStatus } from './types';
import './styles.css';

// Welcome screen for when no project is loaded
function WelcomeScreen({ onNewProject, onOpenProject }: { onNewProject: () => void; onOpenProject: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-accent shadow-accent-lg">
          <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-4">Welcome to ZeroConfig</h1>
        <p className="text-lg text-muted mb-8">
          Zero-configuration development environments. Create or open a project to get started.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onNewProject}
            className="btn btn-primary text-lg px-8 py-4"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Project
          </button>
          <button
            onClick={onOpenProject}
            className="btn btn-secondary text-lg px-8 py-4"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Open Existing Project
          </button>
        </div>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-card p-6">
            <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center mb-4 mx-auto">
              <svg className="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Zero Setup</h3>
            <p className="text-sm text-muted">Auto-detect languages, databases, and services</p>
          </div>
          <div className="glass-card p-6">
            <div className="w-12 h-12 rounded-lg bg-accent-purple/20 flex items-center justify-center mb-4 mx-auto">
              <svg className="h-6 w-6 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Docker/Podman</h3>
            <p className="text-sm text-muted">Works with your preferred container runtime</p>
          </div>
          <div className="glass-card p-6">
            <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center mb-4 mx-auto">
              <svg className="h-6 w-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Cloud Emulators</h3>
            <p className="text-sm text-muted">Local AWS, GCP, and Azure emulation</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [projectPath, setProjectPath] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const loadServices = useCallback(async (path: string) => {
    if (!path) return;

    setIsLoading(true);

    try {
      const output = await invoke<string>('list_services', { projectPath: path });

      // Parse CLI output (format from `ps` command: "  /container_name - status")
      const lines = output.trim().split('\n').filter(line => line.trim());
      const parsedServices: Service[] = [];

      for (const line of lines) {
        // Skip header lines and empty lines
        if (line.includes('Running services:') || line.includes('No services')) {
          continue;
        }

        // Parse line format: "  /zeroconfig-project_postgres - Up 2 minutes"
        if (line.includes(' - ')) {
          const [namepart, statusPart] = line.split(' - ').map(s => s.trim());

          // Extract service name (remove leading slash and project prefix)
          const fullName = namepart.replace(/^\//, '');
          const serviceName = fullName.split('_').pop() || fullName;

          // Determine status from CLI output
          const isRunning = statusPart.toLowerCase().includes('up');
          const status = isRunning ? ServiceStatus.Running : ServiceStatus.Stopped;

          parsedServices.push({
            name: serviceName,
            image: `${serviceName}:latest`,
            status,
            port: undefined,
            config: {
              image: `${serviceName}:latest`,
              port: { internal: 0, external: 0 },
            },
          });
        }
      }

      setServices(parsedServices);
      console.log('Services loaded:', parsedServices);
    } catch (err) {
      console.error('Failed to load services:', err);
      const errorMsg = String(err);

      // Don't show error toast for fresh projects with no services
      if (!errorMsg.includes('zero.yml') && !errorMsg.includes('No such file')) {
        if (errorMsg.includes('Docker') || errorMsg.includes('not running')) {
          toast.warning('Container runtime not running. Start Docker or Podman to manage services.');
        }
      }

      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Try to load last project on mount
  useEffect(() => {
    const lastProject = localStorage.getItem('zeroconfig_last_project');
    if (lastProject) {
      setProjectPath(lastProject);
      setProjectName(lastProject.split(/[\\/]/).pop() || lastProject);
      loadServices(lastProject);
    }
  }, [loadServices]);

  const handleRefresh = async () => {
    await loadServices(projectPath);
  };

  const handleOpenProject = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Open ZeroConfig Project',
      });

      if (selected && typeof selected === 'string') {
        setProjectPath(selected);
        setProjectName(selected.split(/[\\/]/).pop() || selected);
        localStorage.setItem('zeroconfig_last_project', selected);
        toast.success(`Opened project: ${selected.split(/[\\/]/).pop()}`);
        await loadServices(selected);
      }
    } catch (err) {
      toast.error('Failed to open project directory');
      console.error(err);
    }
  };

  const handleNewProject = () => {
    setIsCreateModalOpen(true);
  };

  const handleProjectCreated = (newProjectPath?: string) => {
    if (newProjectPath) {
      setProjectPath(newProjectPath);
      setProjectName(newProjectPath.split(/[\\/]/).pop() || newProjectPath);
      localStorage.setItem('zeroconfig_last_project', newProjectPath);
      loadServices(newProjectPath);
    }
    setIsCreateModalOpen(false);
  };

  const handleCloseProject = () => {
    setProjectPath('');
    setProjectName('');
    setServices([]);
    localStorage.removeItem('zeroconfig_last_project');
  };

  // Show welcome screen if no project is loaded
  const showWelcome = !projectPath;

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gradient-primary">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            projectPath={projectPath}
            projectName={projectName}
            onRefresh={handleRefresh}
            onOpenProject={handleOpenProject}
            onNewProject={handleNewProject}
            onCloseProject={projectPath ? handleCloseProject : undefined}
            isLoading={isLoading}
          />
          <main className="flex-1 overflow-y-auto">
            {showWelcome ? (
              <WelcomeScreen onNewProject={handleNewProject} onOpenProject={handleOpenProject} />
            ) : (
              <div className="p-6">
                <Routes>
                  <Route
                    path="/"
                    element={
                      <Dashboard
                        services={services}
                        cloudEmulators={0}
                        projectPath={projectPath}
                        onRefresh={handleRefresh}
                        onError={toast.error}
                        onSuccess={toast.success}
                      />
                    }
                  />
                  <Route
                    path="/services"
                    element={
                      <Services
                        services={services}
                        projectPath={projectPath}
                        onRefresh={handleRefresh}
                        onError={toast.error}
                        onSuccess={toast.success}
                      />
                    }
                  />
                  <Route
                    path="/cloud"
                    element={
                      <CloudEmulators
                        projectPath={projectPath}
                        onError={toast.error}
                        onSuccess={toast.success}
                      />
                    }
                  />
                  <Route path="/monitoring" element={<Monitoring services={services} />} />
                  <Route path="/logs" element={<Logs services={services} projectPath={projectPath} />} />
                  <Route path="/config" element={<Configuration projectPath={projectPath} />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </div>
            )}
          </main>
        </div>

        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleProjectCreated}
        />

        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      </div>
    </BrowserRouter>
  );
}

export default App;
