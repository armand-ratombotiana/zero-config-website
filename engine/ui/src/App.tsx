import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { CommandPalette } from './components/common/CommandPalette';
import { NotificationCenter, Notification } from './components/notifications/NotificationCenter';
import { Dashboard } from './pages/Dashboard';
import { Services } from './pages/Services';
import { CloudEmulators } from './pages/CloudEmulators';
import { Monitoring } from './pages/Monitoring';
import { Logs } from './pages/Logs';
import { Configuration } from './pages/Configuration';
import { Settings } from './pages/Settings';
import CreateProjectModal from './components/modals/CreateProjectModal';
import { ToastContainer } from './components/notifications/ToastNotification';
import { Breadcrumbs } from './components/navigation/Breadcrumbs';
import { ProjectList, addRecentProject } from './components/projects/ProjectList';
import { useToast } from './hooks/useToast';
import { useKeyboardShortcuts, GLOBAL_SHORTCUTS } from './hooks/useKeyboardShortcuts';
import { Service, ServiceStatus } from './types';
import './styles.css';

// Welcome screen for when no project is loaded
function WelcomeScreen({
  onNewProject,
  onOpenProject,
  onSelectProject
}: {
  onNewProject: () => void;
  onOpenProject: () => void;
  onSelectProject: (path: string) => void;
}) {
  return (
    <div className="flex-1 flex p-8 gap-8">
      {/* Left: Welcome message and actions */}
      <div className="flex-1 flex flex-col justify-center max-w-xl">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-accent shadow-accent-lg">
          <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-3">Welcome to ZeroConfig</h1>
        <p className="text-lg text-muted mb-8">
          Zero-configuration development environments. Create or open a project to get started.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onNewProject}
            className="btn btn-primary px-6 py-3"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Project
          </button>
          <button
            onClick={onOpenProject}
            className="btn btn-secondary px-6 py-3"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Open Project
          </button>
        </div>

        {/* Features */}
        <div className="mt-10 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center mb-2 mx-auto">
              <svg className="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-white text-sm font-medium">Zero Setup</h3>
            <p className="text-xs text-muted mt-1">Auto-detect stack</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-lg bg-accent-purple/20 flex items-center justify-center mb-2 mx-auto">
              <svg className="h-5 w-5 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-white text-sm font-medium">Multi-Runtime</h3>
            <p className="text-xs text-muted mt-1">Docker & Podman</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center mb-2 mx-auto">
              <svg className="h-5 w-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <h3 className="text-white text-sm font-medium">Cloud Local</h3>
            <p className="text-xs text-muted mt-1">AWS, GCP, Azure</p>
          </div>
        </div>
      </div>

      {/* Right: Recent Projects */}
      <div className="w-96 glass-card p-6">
        <ProjectList onSelectProject={onSelectProject} />
      </div>
    </div>
  );
}

function AppLayout() {
  const [projectPath, setProjectPath] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Notification State
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const toast = useToast();
  const navigate = useNavigate();

  // Add notification helper
  const addNotification = useCallback((title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);

    // Also show toast
    if (type === 'error') toast.error(message);
    else if (type === 'success') toast.success(message);
    else if (type === 'warning') toast.warning(message);
    else toast.info(message);
  }, [toast]);

  const loadServices = useCallback(async (path: string, silent = false) => {
    if (!path) return;

    if (!silent) setIsLoading(true);

    try {
      const services = await invoke<Service[]>('list_services', { projectPath: path });

      // Map backend service info to frontend Service type if needed
      // The backend returns ServiceInfo which matches Service interface mostly
      // Backend: { name, image, status, port, stats }
      // Frontend Service: { name, image, status, port, config, stats, healthStatus }

      const mappedServices: Service[] = services.map(s => ({
        ...s,
        config: {
          image: s.image,
          port: { internal: 0, external: s.port || 0 },
        },
        // Ensure status is mapped correctly if needed
        status: s.status as ServiceStatus,
      }));

      setServices(mappedServices);
    } catch (err) {
      console.error('Failed to load services:', err);
      const errorMsg = String(err);

      // Don't show error toast for fresh projects with no services
      if (!errorMsg.includes('zero.yml') && !errorMsg.includes('No such file')) {
        if (!silent) {
          if (errorMsg.includes('Docker') || errorMsg.includes('not running')) {
            addNotification('Runtime Error', 'Container runtime not running. Start Docker or Podman to manage services.', 'warning');
          } else {
            addNotification('Error', `Failed to load services: ${errorMsg}`, 'error');
          }
        }
      }

      setServices([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [addNotification]);

  // Try to load last project on mount
  useEffect(() => {
    const lastProject = localStorage.getItem('zeroconfig_last_project');
    if (lastProject) {
      setProjectPath(lastProject);
      setProjectName(lastProject.split(/[\\/]/).pop() || lastProject);
      loadServices(lastProject);
    }
  }, [loadServices]);

  // Background polling
  useEffect(() => {
    if (!projectPath) return;

    const interval = setInterval(() => {
      loadServices(projectPath, true);
    }, 5000);

    return () => clearInterval(interval);
  }, [projectPath, loadServices]);

  const handleRefresh = async () => {
    await loadServices(projectPath);
    addNotification('Refreshed', 'Service list refreshed successfully', 'success');
  };

  const handleOpenProject = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Open ZeroConfig Project',
      });

      if (selected && typeof selected === 'string') {
        selectProject(selected);
      }
    } catch (err) {
      addNotification('Error', 'Failed to open project directory', 'error');
      console.error(err);
    }
  };

  const selectProject = async (path: string) => {
    const name = path.split(/[\\/]/).pop() || path;
    setProjectPath(path);
    setProjectName(name);
    localStorage.setItem('zeroconfig_last_project', path);
    addRecentProject({ path, name });
    addNotification('Project Opened', `Opened project: ${name}`, 'success');
    await loadServices(path);
  };

  const handleNewProject = () => {
    setIsCreateModalOpen(true);
  };

  const handleProjectCreated = (newProjectPath?: string) => {
    if (newProjectPath) {
      const name = newProjectPath.split(/[\\/]/).pop() || newProjectPath;
      setProjectPath(newProjectPath);
      setProjectName(name);
      localStorage.setItem('zeroconfig_last_project', newProjectPath);
      addRecentProject({ path: newProjectPath, name });
      loadServices(newProjectPath);
      addNotification('Project Created', `Created project: ${name}`, 'success');
    }
    setIsCreateModalOpen(false);
  };

  const handleCloseProject = () => {
    setProjectPath('');
    setProjectName('');
    setServices([]);
    localStorage.removeItem('zeroconfig_last_project');
    addNotification('Project Closed', 'Project closed successfully', 'info');
  };

  // Notification Handlers
  const handleToggleNotifications = () => setIsNotificationCenterOpen(prev => !prev);
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const handleClearNotifications = () => setNotifications([]);
  const handleRemoveNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Keyboard Shortcuts
  useKeyboardShortcuts([
    {
      id: 'settings',
      combo: GLOBAL_SHORTCUTS.SETTINGS,
      handler: () => navigate('/settings'),
      description: 'Go to Settings'
    },
    {
      id: 'refresh',
      combo: GLOBAL_SHORTCUTS.REFRESH,
      handler: (e) => {
        e.preventDefault();
        handleRefresh();
      },
      description: 'Refresh Data'
    },
    {
      id: 'nav-dashboard',
      combo: { key: '1', meta: true, ctrl: true },
      handler: () => navigate('/'),
      description: 'Go to Dashboard'
    },
    {
      id: 'nav-services',
      combo: { key: '2', meta: true, ctrl: true },
      handler: () => navigate('/services'),
      description: 'Go to Services'
    },
    {
      id: 'nav-cloud',
      combo: { key: '3', meta: true, ctrl: true },
      handler: () => navigate('/cloud'),
      description: 'Go to Cloud Emulators'
    },
    {
      id: 'nav-monitoring',
      combo: { key: '4', meta: true, ctrl: true },
      handler: () => navigate('/monitoring'),
      description: 'Go to Monitoring'
    },
    {
      id: 'nav-logs',
      combo: { key: '5', meta: true, ctrl: true },
      handler: () => navigate('/logs'),
      description: 'Go to Logs'
    },
    {
      id: 'nav-config',
      combo: { key: '6', meta: true, ctrl: true },
      handler: () => navigate('/config'),
      description: 'Go to Configuration'
    },
    {
      id: 'nav-settings-num',
      combo: { key: '7', meta: true, ctrl: true },
      handler: () => navigate('/settings'),
      description: 'Go to Settings'
    }
  ]);

  // Show welcome screen if no project is loaded
  const showWelcome = !projectPath;
  const runningServicesCount = services.filter(s => s.status === ServiceStatus.Running).length;
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-gradient-primary">
      <Sidebar
        projectName={projectName}
        projectPath={projectPath}
        onSelectProject={selectProject}
        onNewProject={handleNewProject}
        onOpenProject={handleOpenProject}
        servicesCount={services.length}
        runningServicesCount={runningServicesCount}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          projectPath={projectPath}
          projectName={projectName}
          onRefresh={handleRefresh}
          onOpenProject={handleOpenProject}
          onNewProject={handleNewProject}
          onCloseProject={projectPath ? handleCloseProject : undefined}
          isLoading={isLoading}
          onToggleNotifications={handleToggleNotifications}
          notificationCount={unreadNotificationsCount}
        />
        <main className="flex-1 overflow-y-auto">
          {showWelcome ? (
            <WelcomeScreen
              onNewProject={handleNewProject}
              onOpenProject={handleOpenProject}
              onSelectProject={selectProject}
            />
          ) : (
            <div className="p-6">
              <Breadcrumbs projectName={projectName} />
              <Routes>
                <Route
                  path="/"
                  element={
                    <Dashboard
                      services={services}
                      cloudEmulators={0}
                      projectPath={projectPath}
                      onRefresh={handleRefresh}
                      onError={(msg) => addNotification('Error', msg, 'error')}
                      onSuccess={(msg) => addNotification('Success', msg, 'success')}
                      notifications={notifications}
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
                      onError={(msg) => addNotification('Error', msg, 'error')}
                      onSuccess={(msg) => addNotification('Success', msg, 'success')}
                    />
                  }
                />
                <Route
                  path="/cloud"
                  element={
                    <CloudEmulators
                      projectPath={projectPath}
                      onError={(msg) => addNotification('Error', msg, 'error')}
                      onSuccess={(msg) => addNotification('Success', msg, 'success')}
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
      <CommandPalette />
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onClearAll={handleClearNotifications}
        onRemove={handleRemoveNotification}
      />
    </div>
  );
}

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
