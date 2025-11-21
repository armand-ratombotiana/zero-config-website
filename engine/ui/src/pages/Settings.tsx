import { useState, useEffect } from 'react';
import { Bell, Palette, Database, Zap, Check, Loader2 } from 'lucide-react';

const SETTINGS_KEY = 'zeroconfig_settings';

const defaultSettings = {
  notifications: {
    serviceStartStop: true,
    healthCheckFailures: true,
    resourceAlerts: true,
    updates: false,
  },
  appearance: {
    theme: 'dark',
    accentColor: 'orange',
    compactMode: false,
  },
  docker: {
    autoStart: true,
    autoStop: false,
    resourceLimit: true,
    maxCpu: 4,
    maxMemory: 8,
  },
  advanced: {
    autoUpdate: true,
    telemetry: false,
    experimentalFeatures: false,
  },
};

export function Settings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }, []);

  const handleToggle = (section: keyof typeof settings, key: string) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !(prev[section] as Record<string, unknown>)[key],
      },
    }));
    setHasChanges(true);
    setSaveMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      setHasChanges(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      setSaveMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings(defaultSettings);
      localStorage.removeItem(SETTINGS_KEY);
      setSaveMessage({ type: 'success', text: 'Settings reset to defaults' });
      setHasChanges(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="mt-1 text-sm text-gray-400">
            Customize ZeroConfig to suit your workflow
          </p>
        </div>
        {hasChanges && (
          <span className="text-sm text-warning-500">Unsaved changes</span>
        )}
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
          saveMessage.type === 'success' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
        }`}>
          <Check className="h-4 w-4" />
          <span className="text-sm">{saveMessage.text}</span>
        </div>
      )}

      {/* Notifications */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="rounded-lg bg-accent/10 p-2">
            <Bell className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
            <p className="text-sm text-gray-400">Manage notification preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(settings.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </p>
                <p className="text-xs text-gray-400">
                  Receive notifications for this event
                </p>
              </div>
              <button
                onClick={() => handleToggle('notifications', key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-accent' : 'bg-gray-700'
                }`}
                role="switch"
                aria-checked={value}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="rounded-lg bg-accent-purple/10 p-2">
            <Palette className="h-5 w-5 text-accent-purple" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Appearance</h2>
            <p className="text-sm text-gray-400">Customize the look and feel</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Theme</label>
            <select
              value={settings.appearance.theme}
              onChange={(e) => {
                setSettings((prev) => ({
                  ...prev,
                  appearance: { ...prev.appearance, theme: e.target.value },
                }));
                setHasChanges(true);
              }}
              className="input"
            >
              <option value="dark">Dark</option>
              <option value="light" disabled>Light (Coming Soon)</option>
              <option value="auto" disabled>Auto (Coming Soon)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Accent Color</label>
            <div className="grid grid-cols-6 gap-3">
              {[
                { name: 'orange', color: '#FF6A00' },
                { name: 'purple', color: '#7C5CFF' },
                { name: 'green', color: '#00C48C' },
                { name: 'blue', color: '#0EA5E9' },
                { name: 'red', color: '#FF4D6D' },
                { name: 'pink', color: '#EC4899' },
              ].map(({ name, color }) => (
                <button
                  key={name}
                  onClick={() => {
                    setSettings((prev) => ({
                      ...prev,
                      appearance: { ...prev.appearance, accentColor: name },
                    }));
                    setHasChanges(true);
                  }}
                  className={`h-10 rounded-lg border-2 transition-transform hover:scale-105 ${
                    settings.appearance.accentColor === name
                      ? 'border-white ring-2 ring-white/50'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`${name} accent color`}
                  title={name.charAt(0).toUpperCase() + name.slice(1)}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Compact Mode</p>
              <p className="text-xs text-gray-400">Reduce spacing and padding</p>
            </div>
            <button
              onClick={() => handleToggle('appearance', 'compactMode')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.appearance.compactMode ? 'bg-accent' : 'bg-gray-700'
              }`}
              role="switch"
              aria-checked={settings.appearance.compactMode}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.appearance.compactMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Docker Settings */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="rounded-lg bg-success/10 p-2">
            <Database className="h-5 w-5 text-success" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Container Runtime</h2>
            <p className="text-sm text-gray-400">Configure Docker/Podman behavior</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Auto-start Services</p>
              <p className="text-xs text-gray-400">Start services when project opens</p>
            </div>
            <button
              onClick={() => handleToggle('docker', 'autoStart')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.docker.autoStart ? 'bg-accent' : 'bg-gray-700'
              }`}
              role="switch"
              aria-checked={settings.docker.autoStart}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.docker.autoStart ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Auto-stop Services</p>
              <p className="text-xs text-gray-400">Stop services when closing application</p>
            </div>
            <button
              onClick={() => handleToggle('docker', 'autoStop')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.docker.autoStop ? 'bg-accent' : 'bg-gray-700'
              }`}
              role="switch"
              aria-checked={settings.docker.autoStop}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.docker.autoStop ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Max CPU Cores: <span className="text-accent">{settings.docker.maxCpu}</span>
            </label>
            <input
              type="range"
              min="1"
              max="16"
              value={settings.docker.maxCpu}
              onChange={(e) => {
                setSettings((prev) => ({
                  ...prev,
                  docker: { ...prev.docker, maxCpu: parseInt(e.target.value) },
                }));
                setHasChanges(true);
              }}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Max Memory (GB): <span className="text-accent">{settings.docker.maxMemory}</span>
            </label>
            <input
              type="range"
              min="1"
              max="32"
              value={settings.docker.maxMemory}
              onChange={(e) => {
                setSettings((prev) => ({
                  ...prev,
                  docker: { ...prev.docker, maxMemory: parseInt(e.target.value) },
                }));
                setHasChanges(true);
              }}
              className="w-full accent-accent"
            />
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="rounded-lg bg-warning/10 p-2">
            <Zap className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Advanced</h2>
            <p className="text-sm text-gray-400">Advanced configuration options</p>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(settings.advanced).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </p>
                <p className="text-xs text-gray-400">
                  {key === 'autoUpdate' && 'Automatically update ZeroConfig'}
                  {key === 'telemetry' && 'Send anonymous usage data'}
                  {key === 'experimentalFeatures' && 'Enable beta features (may be unstable)'}
                </p>
              </div>
              <button
                onClick={() => handleToggle('advanced', key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-accent' : 'bg-gray-700'
                }`}
                role="switch"
                aria-checked={value}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-white/10">
        <button
          onClick={handleReset}
          className="btn btn-ghost text-muted hover:text-white"
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary px-8 flex items-center space-x-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
