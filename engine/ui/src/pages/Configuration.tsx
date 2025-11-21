import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Upload, Check, AlertCircle, Code, Eye, Wand2, Split, History, Save, RefreshCw } from 'lucide-react';
import { tauriApi } from '../services/tauri';
import { AVAILABLE_TEMPLATES } from '../types';
import Editor from '@monaco-editor/react';
import yaml from 'js-yaml';
import clsx from 'clsx';

interface ConfigurationProps {
  projectPath?: string;
}

interface ValidationResult {
  type: 'success' | 'error';
  message: string;
}

interface ConfigHistory {
  timestamp: number;
  content: string;
}

export function Configuration({ projectPath = '' }: ConfigurationProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'editor' | 'visual'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [configContent, setConfigContent] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<ValidationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<ConfigHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [parsedConfig, setParsedConfig] = useState<any>(null);

  // Auto-load config when project path changes
  useEffect(() => {
    if (projectPath) {
      handleLoad();
    }
  }, [projectPath]);

  // Parse YAML whenever content changes
  useEffect(() => {
    try {
      const parsed = yaml.load(configContent);
      setParsedConfig(parsed);
      if (configContent.trim()) {
        setValidationMessage(null);
      }
    } catch (e: any) {
      setValidationMessage({ type: 'error', message: e.message });
    }
  }, [configContent]);

  const addToHistory = (content: string) => {
    setHistory(prev => [
      { timestamp: Date.now(), content },
      ...prev.slice(0, 9) // Keep last 10 versions
    ]);
  };

  const handleTemplateSelect = async (templateName: string) => {
    try {
      setSelectedTemplate(templateName);
      const content = await tauriApi.loadTemplate(templateName);
      setConfigContent(content);
      addToHistory(content);
      setActiveTab('editor');
    } catch (error) {
      console.error('Failed to load template:', error);
      setValidationMessage({ type: 'error', message: `Failed to load template: ${error}` });
    }
  };

  const handleValidate = async () => {
    if (!configContent.trim()) {
      setValidationMessage({ type: 'error', message: 'Configuration is empty' });
      return;
    }

    setIsValidating(true);
    setValidationMessage(null);

    try {
      const result = await tauriApi.validateConfig(configContent);
      setValidationMessage({ type: 'success', message: result });
    } catch (error) {
      setValidationMessage({ type: 'error', message: `${error}` });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    if (!projectPath) {
      setValidationMessage({ type: 'error', message: 'No project selected. Please open a project first.' });
      return;
    }

    if (!configContent.trim()) {
      setValidationMessage({ type: 'error', message: 'Configuration is empty' });
      return;
    }

    setIsSaving(true);
    setValidationMessage(null);

    try {
      await tauriApi.validateConfig(configContent);
      const result = await tauriApi.saveConfig(projectPath, configContent);
      setValidationMessage({ type: 'success', message: result });
      addToHistory(configContent);
    } catch (error) {
      setValidationMessage({ type: 'error', message: `${error}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async () => {
    if (!projectPath) {
      setValidationMessage({ type: 'error', message: 'No project selected. Please open a project first.' });
      return;
    }

    try {
      const content = await tauriApi.loadConfig(projectPath);
      setConfigContent(content);
      addToHistory(content);
      setActiveTab('editor');
      setValidationMessage({ type: 'success', message: 'Configuration loaded successfully' });
    } catch (error) {
      const errorStr = String(error);
      if (!errorStr.includes('No such file') && !errorStr.includes('cannot find')) {
        setValidationMessage({ type: 'error', message: `${error}` });
      }
    }
  };

  const handleVisualChange = (newConfig: any) => {
    try {
      const newYaml = yaml.dump(newConfig);
      setConfigContent(newYaml);
      setParsedConfig(newConfig);
    } catch (e: any) {
      console.error('Failed to convert config to YAML:', e);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Configuration</h1>
          <p className="text-muted mt-1">Create and manage your zero.yml configuration</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={clsx("btn btn-ghost flex items-center space-x-2", showHistory && "bg-white/10")}
            title="Version History"
          >
            <History className="h-4 w-4" />
          </button>
          <div className="w-px h-8 bg-white/10 mx-2" />
          <button onClick={handleLoad} className="btn btn-ghost flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Load</span>
          </button>
          <button onClick={handleValidate} disabled={isValidating} className="btn btn-ghost flex items-center space-x-2">
            <Check className="h-4 w-4" />
            <span>{isValidating ? 'Validating...' : 'Validate'}</span>
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn btn-primary flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save & Apply'}</span>
          </button>
        </div>
      </div>

      {/* Validation Message */}
      {validationMessage && (
        <div className={clsx(
          "glass-card p-4 flex items-center space-x-3 shrink-0 animate-in slide-in-from-top-2",
          validationMessage.type === 'success' ? 'border-success/50 bg-success/5' : 'border-danger/50 bg-danger/5'
        )}>
          {validationMessage.type === 'success' ? (
            <Check className="h-5 w-5 text-success" />
          ) : (
            <AlertCircle className="h-5 w-5 text-danger" />
          )}
          <span className={validationMessage.type === 'success' ? 'text-success' : 'text-danger'}>
            {validationMessage.message}
          </span>
        </div>
      )}

      {/* History Panel */}
      {showHistory && history.length > 0 && (
        <div className="glass-card p-4 shrink-0 animate-in slide-in-from-top-4">
          <h3 className="text-sm font-semibold text-white mb-3">Version History</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {history.map((ver, i) => (
              <button
                key={ver.timestamp}
                onClick={() => setConfigContent(ver.content)}
                className="flex flex-col items-start p-2 rounded bg-white/5 hover:bg-white/10 border border-white/5 min-w-[120px] text-xs transition-colors"
              >
                <span className="text-gray-300 font-medium">Version {history.length - i}</span>
                <span className="text-gray-500">{new Date(ver.timestamp).toLocaleTimeString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-white/10 shrink-0">
        <TabButton
          active={activeTab === 'templates'}
          onClick={() => setActiveTab('templates')}
          icon={<FileText className="h-4 w-4" />}
          label="Templates"
        />
        <TabButton
          active={activeTab === 'editor'}
          onClick={() => setActiveTab('editor')}
          icon={<Code className="h-4 w-4" />}
          label="YAML Editor"
        />
        <TabButton
          active={activeTab === 'visual'}
          onClick={() => setActiveTab('visual')}
          icon={<Wand2 className="h-4 w-4" />}
          label="Visual Builder"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'templates' && (
          <div className="h-full overflow-y-auto pr-2">
            <TemplatesView onSelectTemplate={handleTemplateSelect} selectedTemplate={selectedTemplate} />
          </div>
        )}
        {activeTab === 'editor' && (
          <EditorView content={configContent} onChange={setConfigContent} />
        )}
        {activeTab === 'visual' && (
          <div className="h-full overflow-y-auto pr-2">
            <VisualBuilderView config={parsedConfig} onChange={handleVisualChange} />
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-4 py-2 font-medium transition-colors flex items-center space-x-2",
        active ? "text-accent border-b-2 border-accent" : "text-muted hover:text-white"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Templates View Component
function TemplatesView({ onSelectTemplate, selectedTemplate }: { onSelectTemplate: (name: string) => void; selectedTemplate: string }) {
  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Choose a Template</h2>
        <p className="text-muted">Start with a pre-configured template for your project type</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AVAILABLE_TEMPLATES.map((template) => (
          <button
            key={template.name}
            onClick={() => onSelectTemplate(template.name)}
            className={clsx(
              "glass-card p-6 text-left transition-all hover:scale-[1.02] hover:bg-white/5",
              selectedTemplate === template.name && "border-accent shadow-lg shadow-accent/10 ring-1 ring-accent"
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl">{template.icon}</span>
              {selectedTemplate === template.name && (
                <Check className="h-5 w-5 text-accent" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{template.displayName}</h3>
            <p className="text-sm text-muted mb-4">{template.description}</p>
            <div className="flex flex-wrap gap-2">
              {template.languages.map((lang) => (
                <span key={lang} className="px-2 py-1 text-xs rounded-full bg-accent/20 text-accent">
                  {lang}
                </span>
              ))}
              {template.services.map((service) => (
                <span key={service} className="px-2 py-1 text-xs rounded-full bg-success/20 text-success">
                  {service}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Custom Configuration</h3>
        <p className="text-muted mb-4">Or start from scratch and build your own configuration</p>
        <button
          onClick={() => onSelectTemplate('default')}
          className="btn btn-ghost"
        >
          Start from Scratch
        </button>
      </div>
    </div>
  );
}

// Editor View Component
function EditorView({ content, onChange }: { content: string; onChange: (content: string) => void }) {
  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-xl font-semibold text-white">YAML Editor</h2>
        <div className="flex items-center space-x-2 text-sm text-muted">
          <Eye className="h-4 w-4" />
          <span>Monaco Editor Integration</span>
        </div>
      </div>

      <div className="flex-1 glass-card p-0 overflow-hidden border border-white/10">
        <Editor
          height="100%"
          defaultLanguage="yaml"
          value={content}
          onChange={(value) => onChange(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}
        />
      </div>

      <div className="glass-card p-4 bg-surface/50 shrink-0">
        <h3 className="text-sm font-semibold text-white mb-2">💡 Tips</h3>
        <ul className="text-sm text-muted space-y-1">
          <li>• Use <code className="text-accent">auto</code> for automatic port assignment</li>
          <li>• Use <code className="text-accent">auto-generate</code> for environment variables to generate secure values</li>
          <li>• Ctrl+S to save changes</li>
        </ul>
      </div>
    </div>
  );
}

// Visual Builder View Component
function VisualBuilderView({ config, onChange }: { config: any; onChange: (config: any) => void }) {
  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
        <p>Invalid or empty configuration. Please use the YAML editor to fix issues.</p>
      </div>
    );
  }

  const updateField = (path: string[], value: any) => {
    const newConfig = { ...config };
    let current = newConfig;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    onChange(newConfig);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Metadata Section */}
      <section className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent" />
          Project Metadata
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Project Name</label>
            <input
              type="text"
              value={config.metadata?.name || ''}
              onChange={(e) => updateField(['metadata', 'name'], e.target.value)}
              className="input w-full"
              placeholder="my-awesome-project"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Version</label>
            <input
              type="text"
              value={config.metadata?.version || ''}
              onChange={(e) => updateField(['metadata', 'version'], e.target.value)}
              className="input w-full"
              placeholder="1.0.0"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-300">Description</label>
            <textarea
              value={config.metadata?.description || ''}
              onChange={(e) => updateField(['metadata', 'description'], e.target.value)}
              className="input w-full min-h-[80px]"
              placeholder="Describe your project..."
            />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Code className="w-5 h-5 text-success" />
          Services
        </h3>
        <div className="space-y-4">
          {Object.entries(config.services || {}).map(([name, service]: [string, any]) => (
            <div key={name} className="bg-white/5 rounded-lg p-4 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-white">{name}</h4>
                <button
                  onClick={() => {
                    const newServices = { ...config.services };
                    delete newServices[name];
                    updateField(['services'], newServices);
                  }}
                  className="text-danger hover:text-danger-light transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Version</label>
                  <input
                    type="text"
                    value={service.version || ''}
                    onChange={(e) => updateField(['services', name, 'version'], e.target.value)}
                    className="input w-full text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Port</label>
                  <input
                    type="text"
                    value={service.port || ''}
                    onChange={(e) => updateField(['services', name, 'port'], e.target.value)}
                    className="input w-full text-sm"
                    placeholder="auto"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              const name = prompt('Enter service name (e.g., postgres):');
              if (name) {
                updateField(['services', name], { version: 'latest', port: 'auto' });
              }
            }}
            className="btn btn-secondary w-full border-dashed"
          >
            + Add Service
          </button>
        </div>
      </section>

      {/* Environment Variables */}
      <section className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-warning" />
          Environment Variables
        </h3>
        <div className="space-y-3">
          {Object.entries(config.env || {}).map(([key, value]: [string, any]) => (
            <div key={key} className="flex gap-3">
              <input
                type="text"
                value={key}
                readOnly
                className="input w-1/3 bg-white/5 text-gray-400"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => updateField(['env', key], e.target.value)}
                className="input flex-1"
              />
              <button
                onClick={() => {
                  const newEnv = { ...config.env };
                  delete newEnv[key];
                  updateField(['env'], newEnv);
                }}
                className="p-2 text-gray-400 hover:text-danger transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="NEW_VAR_NAME"
              className="input w-1/3"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  if (target.value) {
                    updateField(['env', target.value], '');
                    target.value = '';
                  }
                }
              }}
            />
            <div className="flex-1 flex items-center text-sm text-gray-500 italic px-3">
              Press Enter to add variable
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Helper icon component
function Trash2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18"></path>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  );
}