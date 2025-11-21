import { useState } from 'react';
import { FileText, Download, Upload, Check, AlertCircle, Code, Eye, Wand2 } from 'lucide-react';
import { tauriApi } from '../services/tauri';
import { AVAILABLE_TEMPLATES } from '../types';

export function Configuration() {
  const [activeTab, setActiveTab] = useState<'templates' | 'editor' | 'visual'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [configContent, setConfigContent] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleTemplateSelect = async (templateName: string) => {
    try {
      setSelectedTemplate(templateName);
      const content = await tauriApi.loadTemplate(templateName);
      setConfigContent(content);
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
    if (!configContent.trim()) {
      setValidationMessage({ type: 'error', message: 'Configuration is empty' });
      return;
    }

    setIsSaving(true);
    setValidationMessage(null);

    try {
      // First validate
      await tauriApi.validateConfig(configContent);
      
      // Then save
      const projectPath = 'C:/Users/judic/OneDrive/Desktop/zero-config/test-project'; // TODO: Get from context
      const result = await tauriApi.saveConfig(projectPath, configContent);
      setValidationMessage({ type: 'success', message: result });
    } catch (error) {
      setValidationMessage({ type: 'error', message: `${error}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async () => {
    try {
      const projectPath = 'C:/Users/judic/OneDrive/Desktop/zero-config/test-project'; // TODO: Get from context
      const content = await tauriApi.loadConfig(projectPath);
      setConfigContent(content);
      setValidationMessage({ type: 'success', message: 'Configuration loaded successfully' });
    } catch (error) {
      setValidationMessage({ type: 'error', message: `${error}` });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Configuration</h1>
          <p className="text-muted mt-1">Create and manage your zero.yml configuration</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleLoad} className="btn btn-ghost flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Load</span>
          </button>
          <button onClick={handleValidate} disabled={isValidating} className="btn btn-ghost flex items-center space-x-2">
            <Check className="h-4 w-4" />
            <span>{isValidating ? 'Validating...' : 'Validate'}</span>
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn btn-primary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Validation Message */}
      {validationMessage && (
        <div className={`glass-card p-4 flex items-center space-x-3 ${
          validationMessage.type === 'success' ? 'border-success' : 'border-danger'
        }`}>
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

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'templates'
              ? 'text-accent border-b-2 border-accent'
              : 'text-muted hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Templates</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'editor'
              ? 'text-accent border-b-2 border-accent'
              : 'text-muted hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Code className="h-4 w-4" />
            <span>YAML Editor</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('visual')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'visual'
              ? 'text-accent border-b-2 border-accent'
              : 'text-muted hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Wand2 className="h-4 w-4" />
            <span>Visual Builder</span>
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {activeTab === 'templates' && (
          <TemplatesView onSelectTemplate={handleTemplateSelect} selectedTemplate={selectedTemplate} />
        )}
        {activeTab === 'editor' && (
          <EditorView content={configContent} onChange={setConfigContent} />
        )}
        {activeTab === 'visual' && (
          <VisualBuilderView content={configContent} onChange={setConfigContent} />
        )}
      </div>
    </div>
  );
}

// Templates View Component
function TemplatesView({ onSelectTemplate, selectedTemplate }: { onSelectTemplate: (name: string) => void; selectedTemplate: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Choose a Template</h2>
        <p className="text-muted">Start with a pre-configured template for your project type</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AVAILABLE_TEMPLATES.map((template) => (
          <button
            key={template.name}
            onClick={() => onSelectTemplate(template.name)}
            className={`glass-card p-6 text-left transition-all hover:scale-105 ${
              selectedTemplate === template.name ? 'border-accent shadow-lg shadow-accent/25' : ''
            }`}
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">YAML Editor</h2>
        <div className="flex items-center space-x-2 text-sm text-muted">
          <Eye className="h-4 w-4" />
          <span>Edit your configuration directly</span>
        </div>
      </div>

      <div className="glass-card p-0 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-[600px] bg-transparent text-white font-mono text-sm p-6 resize-none focus:outline-none"
          placeholder="# Enter your zero.yml configuration here
metadata:
  name: my-project
  description: My awesome project
  version: 1.0.0

languages:
  node: '20'

services:
  postgres:
    version: '16'
    port: auto

env:
  MODE: development
  DATABASE_URL: auto-generate

ports: auto

startup:
  - npm install
  - npm run dev"
          spellCheck={false}
        />
      </div>

      <div className="glass-card p-4 bg-surface/50">
        <h3 className="text-sm font-semibold text-white mb-2">💡 Tips</h3>
        <ul className="text-sm text-muted space-y-1">
          <li>• Use <code className="text-accent">auto</code> for automatic port assignment</li>
          <li>• Use <code className="text-accent">auto-generate</code> for environment variables to generate secure values</li>
          <li>• Validate your configuration before saving</li>
          <li>• Check the templates for examples</li>
        </ul>
      </div>
    </div>
  );
}

// Visual Builder View Component (Placeholder for now)
function VisualBuilderView({ content: _content, onChange: _onChange }: { content: string; onChange: (content: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="glass-card p-8 text-center">
        <Wand2 className="h-16 w-16 text-accent mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-white mb-2">Visual Builder</h2>
        <p className="text-muted mb-6">Coming soon! Build your configuration with a visual interface.</p>
        <p className="text-sm text-muted">
          For now, use the Templates or YAML Editor to create your configuration.
        </p>
      </div>
    </div>
  );
}