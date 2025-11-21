import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
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

function App() {
  const [projectPath, setProjectPath] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [_loading, setLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const toast = useToast();

  // Load services on mount
  useEffect(() => {
    // Set default project path - TODO: make this configurable
    const defaultPath = 'C:/Users/judic/OneDrive/Desktop/zero-config/test-project';
    setProjectPath(defaultPath);
    loadServices(defaultPath);
  }, []);

  const loadServices = async (path: string) => {
    if (!path) return;

    setLoading(true);
    setError(null);

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
            image: `${serviceName}:latest`, // Default, will be updated when we parse config
            status,
            port: undefined, // Will be populated from config
            config: {
              image: `${serviceName}:latest`,
              port: { internal: 0, external: 0 },
            },
          });
        }
      }

      setServices(parsedServices);

      if (parsedServices.length === 0) {
        toast.info('No services running. Start services from the Services page.');
      }

      console.log('Services loaded:', parsedServices);
    } catch (err) {
      console.error('Failed to load services:', err);
      const errorMsg = String(err);
      setError(errorMsg);

      // Check if it's a "no zero.yml" error
      if (errorMsg.includes('zero.yml') || errorMsg.includes('No such file')) {
        toast.error('No zero.yml found in project directory. Please create a project first.');
      } else if (errorMsg.includes('Docker') || errorMsg.includes('not running')) {
        toast.error('Docker is not running. Please start Docker and try again.');
      } else {
        toast.error(`Failed to load services: ${errorMsg}`);
      }

      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadServices(projectPath);
  };

  const handleOpenProject = async () => {
    // TODO: Call Tauri dialog to select project directory
    console.log('Open project dialog');
  };

  const handleNewProject = () => {
    setIsCreateModalOpen(true);
  };

  const handleProjectCreated = () => {
    // Refresh services list after project creation
    handleRefresh();
  };

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gradient-primary">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            projectPath={projectPath}
            onRefresh={handleRefresh}
            onOpenProject={handleOpenProject}
            onNewProject={handleNewProject}
          />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    services={services}
                    cloudEmulators={1}
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
              <Route path="/logs" element={<Logs services={services} />} />
              <Route path="/config" element={<Configuration />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
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
