import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { FolderOpen, Loader2, X, Zap, Database, Server, Layers } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (projectPath?: string) => void;
}

type Template = 'blank' | 'database' | 'cache' | 'fullstack' | 'microservices';

const templates: { id: Template; name: string; description: string; icon: React.ReactNode; services: string[] }[] = [
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start with a minimal ZeroConfig setup',
    icon: <Zap className="h-5 w-5" />,
    services: [],
  },
  {
    id: 'database',
    name: 'With Database',
    description: 'PostgreSQL with auto-generated connection',
    icon: <Database className="h-5 w-5" />,
    services: ['PostgreSQL'],
  },
  {
    id: 'cache',
    name: 'With Cache',
    description: 'Redis for sessions and caching',
    icon: <Server className="h-5 w-5" />,
    services: ['Redis'],
  },
  {
    id: 'fullstack',
    name: 'Full-Stack',
    description: 'Complete setup with database, cache & queue',
    icon: <Layers className="h-5 w-5" />,
    services: ['PostgreSQL', 'Redis', 'RabbitMQ'],
  },
];

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [template, setTemplate] = useState<Template>('blank');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'details' | 'template'>('details');

  const handleSelectDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Project Location',
      });

      if (selected && typeof selected === 'string') {
        setProjectPath(selected);
        setError('');
      }
    } catch (err) {
      setError('Failed to select directory');
      console.error(err);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }

    if (!projectPath) {
      setError('Please select a project location');
      return;
    }

    // Validate project name (alphanumeric, hyphens, underscores only)
    if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
      setError('Project name can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // Normalize path separators for cross-platform compatibility
      const normalizedPath = projectPath.replace(/\\/g, '/');
      const fullPath = `${normalizedPath}/${projectName}`;

      await invoke('init_project', { projectPath: fullPath });

      // Pass the created project path back to parent
      onSuccess(fullPath);
      handleClose();
    } catch (err) {
      const errorStr = String(err);
      if (errorStr.includes('already exists')) {
        setError('A project with this name already exists in the selected directory');
      } else if (errorStr.includes('permission')) {
        setError('Permission denied. Please choose a different location.');
      } else {
        setError(errorStr || 'Failed to create project');
      }
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setProjectName('');
    setProjectPath('');
    setTemplate('blank');
    setError('');
    setIsCreating(false);
    setStep('details');
    onClose();
  };

  const handleNext = () => {
    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }
    if (!projectPath) {
      setError('Please select a project location');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
      setError('Project name can only contain letters, numbers, hyphens, and underscores');
      return;
    }
    setError('');
    setStep('template');
  };

  const handleBack = () => {
    setStep('details');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && !isCreating && handleClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
    >
      <div className="glass-card w-full max-w-2xl p-8 mx-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 id="create-project-title" className="text-2xl font-bold gradient-text">
              Create New Project
            </h2>
            <p className="text-sm text-muted mt-1">
              {step === 'details' ? 'Step 1: Project details' : 'Step 2: Choose a template'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors"
            disabled={isCreating}
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`flex-1 h-1 rounded-full ${step === 'details' ? 'bg-accent' : 'bg-success'}`} />
          <div className={`flex-1 h-1 rounded-full ${step === 'template' ? 'bg-accent' : 'bg-white/10'}`} />
        </div>

        {step === 'details' ? (
          <div className="space-y-6">
            {/* Project Name */}
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-white mb-2">
                Project Name
              </label>
              <input
                id="project-name"
                type="text"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  setError('');
                }}
                placeholder="my-awesome-project"
                className="input"
                disabled={isCreating}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              />
              <p className="text-xs text-muted mt-1">
                Use letters, numbers, hyphens, or underscores
              </p>
            </div>

            {/* Project Location */}
            <div>
              <label htmlFor="project-path" className="block text-sm font-medium text-white mb-2">
                Project Location
              </label>
              <div className="flex gap-2">
                <div
                  className="input flex-1 cursor-pointer flex items-center"
                  onClick={handleSelectDirectory}
                >
                  <FolderOpen className="h-4 w-4 text-muted mr-2 flex-shrink-0" />
                  <span className={projectPath ? 'text-white truncate' : 'text-muted'}>
                    {projectPath || 'Select a directory...'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSelectDirectory}
                  className="btn btn-secondary px-4"
                  disabled={isCreating}
                >
                  Browse
                </button>
              </div>
              {projectPath && projectName && (
                <p className="text-xs text-success mt-2">
                  Project will be created at: {projectPath.replace(/\\/g, '/')}/{projectName}
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-danger/20 border border-danger/50 text-danger px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleNext}
                className="btn btn-primary flex-1"
                disabled={isCreating}
              >
                Next: Choose Template
              </button>
              <button
                onClick={handleClose}
                className="btn btn-ghost"
                disabled={isCreating}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Template Selection */}
            <div className="grid grid-cols-2 gap-4">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    template === t.id
                      ? 'border-accent bg-accent/10 shadow-accent/20 shadow-lg'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    template === t.id ? 'bg-accent text-white' : 'bg-white/10 text-muted'
                  }`}>
                    {t.icon}
                  </div>
                  <h3 className="font-semibold text-white mb-1">{t.name}</h3>
                  <p className="text-xs text-muted mb-2">{t.description}</p>
                  {t.services.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {t.services.map((s) => (
                        <span key={s} className="badge badge-info text-xs">{s}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="glass p-4 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-2">Project Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted">Name:</span>
                <span className="text-white">{projectName}</span>
                <span className="text-muted">Location:</span>
                <span className="text-white truncate" title={projectPath}>{projectPath}</span>
                <span className="text-muted">Template:</span>
                <span className="text-white">{templates.find(t => t.id === template)?.name}</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-danger/20 border border-danger/50 text-danger px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleBack}
                className="btn btn-ghost"
                disabled={isCreating}
              >
                Back
              </button>
              <button
                onClick={handleCreateProject}
                className="btn btn-primary flex-1"
                disabled={isCreating}
              >
                {isCreating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Project...
                  </span>
                ) : (
                  'Create Project'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
