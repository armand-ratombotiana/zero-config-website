import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { CommandPalette } from './components/common/CommandPalette';
import { NotificationCenter } from './components/notifications/NotificationCenter';
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
import { ProjectList } from './components/projects/ProjectList';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useToast } from './hooks/useToast';
import { useKeyboardShortcuts, GLOBAL_SHORTCUTS } from './hooks/useKeyboardShortcuts';
import { useProjectStore } from './stores/projectStore';
import { useNotificationStore } from './stores/notificationStore';
import { useUIStore } from './stores/uiStore';
import { ThemeProvider } from './context/ThemeContext';
import './styles.css';

// Welcome screen for when no project is loaded
function WelcomeScreen() {
  const { selectProject, openProject } = useProjectStore();
  const { openCreateModal } = useUIStore();
  const { addNotification } = useNotificationStore();

  const handleOpenProject = async () => {
    try {
      await openProject();
      addNotification('Project Opened', 'Project opened successfully', 'success');
    } catch (err) {
      addNotification('Error', 'Failed to open project directory', 'error');
      console.error(err);
    }
  };

  const handleSelectProject = async (path: string) => {
    try {
      await selectProject(path);
      addNotification('Project Opened', `Opened project: ${path.split(/[\\/]/).pop()}`, 'success');
    } catch (err) {
      console.error('Failed to select project:', err);
    }
  };
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
            onClick={openCreateModal}
            className="btn btn-primary px-6 py-3"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Project
          </button>
          <button
            onClick={handleOpenProject}
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
        <ProjectList onSelectProject={handleSelectProject} />
      </div>
    </div>
  );
}

function AppLayout() {
  const navigate = useNavigate();
  const toast = useToast();

  // Zustand stores
  const {
    projectPath,
    projectName,
    loadServices,
    selectProject,
    refreshServices
  } = useProjectStore();

  const {
    notifications,
    isNotificationCenterOpen,
    addNotification,
    markAsRead,
    clearAll,
    removeNotification,
    setNotificationCenterOpen
  } = useNotificationStore();

  const {
    isCreateModalOpen,
    closeCreateModal
  } = useUIStore();

  // Integrate toast with notification store
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (!latest.read) {
        const { type, message } = latest;
        if (type === 'error') toast.error(message);
        else if (type === 'success') toast.success(message);
        else if (type === 'warning') toast.warning(message);
        else toast.info(message);
      }
    }
  }, [notifications, toast]);

  const handleLoadServices = async (path: string, silent = false) => {
    try {
      await loadServices(path, silent);
    } catch (err) {
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
    }
  };

  // Try to load last project on mount
  useEffect(() => {
    const lastProject = localStorage.getItem('zeroconfig_last_project');
    if (lastProject) {
      selectProject(lastProject).catch(err => {
        console.error('Failed to load last project:', err);
      });
    }
  }, []);  // Run only once on mount

  // Background polling
  useEffect(() => {
    if (!projectPath) return;

    const interval = setInterval(() => {
      handleLoadServices(projectPath, true);
    }, 5000);

    return () => clearInterval(interval);
  }, [projectPath]);

  const handleRefresh = async () => {
    await refreshServices();
    addNotification('Refreshed', 'Service list refreshed successfully', 'success');
  };


  // Handlers for notification actions passed to NotificationCenter
  const handleMarkAsRead = (id: string) => markAsRead(id);
  const handleClearNotifications = () => clearAll();
  const handleRemoveNotification = (id: string) => removeNotification(id);

  const handleProjectCreated = async (newProjectPath?: string) => {
    if (newProjectPath) {
      await selectProject(newProjectPath);
      addNotification('Project Created', `Created project: ${newProjectPath.split(/[\\/]/).pop()}`, 'success');
    }
    closeCreateModal();
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
  return (
    <div className="flex h-screen bg-gradient-primary">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {showWelcome ? (
            <WelcomeScreen />
          ) : (
            <div className="p-6">
              <Breadcrumbs projectName={projectName} />
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Dashboard />}
                  />
                  <Route path="/services" element={<Services />} />
                  <Route path="/cloud" element={<CloudEmulators />} />
                  <Route path="/monitoring" element={<Monitoring />} />
                  <Route path="/logs" element={<Logs />} />
                  <Route path="/config" element={<Configuration />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </ErrorBoundary>
            </div>
          )}
        </main>
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSuccess={handleProjectCreated}
      />

      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      <CommandPalette />
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setNotificationCenterOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onClearAll={handleClearNotifications}
        onRemove={handleRemoveNotification}
      />
    </div>
  );
}





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