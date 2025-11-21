import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [template, setTemplate] = useState('blank');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSelectDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Project Location',
      });

      if (selected && typeof selected === 'string') {
        setProjectPath(selected);
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

    setIsCreating(true);
    setError('');

    try {
      const fullPath = `${projectPath}/${projectName}`;
      await invoke('init_project', { projectPath: fullPath });

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err as string || 'Failed to create project');
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="glass-card w-full max-w-2xl p-8 mx-4 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold gradient-text">Create New Project</h2>
          <button
            onClick={handleClose}
            className="text-muted hover:text-white transition-colors"
            disabled={isCreating}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

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
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="my-awesome-project"
              className="input"
              disabled={isCreating}
              autoFocus
            />
          </div>

          {/* Project Location */}
          <div>
            <label htmlFor="project-path" className="block text-sm font-medium text-white mb-2">
              Project Location
            </label>
            <div className="flex gap-2">
              <input
                id="project-path"
                type="text"
                value={projectPath}
                readOnly
                placeholder="Select a directory..."
                className="input flex-1 cursor-pointer"
                onClick={handleSelectDirectory}
              />
              <button
                type="button"
                onClick={handleSelectDirectory}
                className="btn btn-secondary px-4"
                disabled={isCreating}
              >
                Browse
              </button>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label htmlFor="template" className="block text-sm font-medium text-white mb-2">
              Template
            </label>
            <select
              id="template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="input"
              disabled={isCreating}
            >
              <option value="blank">Blank Project</option>
              <option value="database">With Database (PostgreSQL)</option>
              <option value="cache">With Cache (Redis)</option>
              <option value="fullstack">Full-Stack (Database + Redis + Queue)</option>
              <option value="microservices">Microservices Setup</option>
            </select>
          </div>

          {/* Template Description */}
          <div className="glass p-4 rounded-lg">
            <p className="text-sm text-muted">
              {template === 'blank' && 'Start with a minimal ZeroConfig setup. Add services later as needed.'}
              {template === 'database' && 'Includes PostgreSQL database with auto-generated connection config.'}
              {template === 'cache' && 'Includes Redis cache for session management and caching.'}
              {template === 'fullstack' && 'Complete setup with PostgreSQL, Redis, and RabbitMQ for background jobs.'}
              {template === 'microservices' && 'Multi-service architecture with API gateway, databases, and message queue.'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-danger/20 border border-danger text-danger px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCreateProject}
              className="btn btn-primary flex-1"
              disabled={isCreating}
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Project...
                </span>
              ) : (
                'Create Project'
              )}
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
      </div>
    </div>
  );
}
