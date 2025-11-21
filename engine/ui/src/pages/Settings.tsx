import { useState } from 'react';
import { Bell, Palette, Database, Zap } from 'lucide-react';

export function Settings() {
  const [settings, setSettings] = useState({
    notifications: {
      serviceStartStop: true,
      healthCheckFailures: true,
      resourceAlerts: true,
      updates: false,
    },
    appearance: {
      theme: 'dark',
      accentColor: 'blue',
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
  });

  const handleToggle = (section: keyof typeof settings, key: string) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !(prev[section] as any)[key],
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-400">
          Customize ZeroConfig to suit your workflow
        </p>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="rounded-lg bg-primary-500/10 p-2">
            <Bell className="h-5 w-5 text-primary-500" />
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
                  value ? 'bg-primary-600' : 'bg-gray-700'
                }`}
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
          <div className="rounded-lg bg-primary-500/10 p-2">
            <Palette className="h-5 w-5 text-primary-500" />
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
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  appearance: { ...prev.appearance, theme: e.target.value },
                }))
              }
              className="input"
            >
              <option value="dark">Dark</option>
              <option value="light">Light (Coming Soon)</option>
              <option value="auto">Auto (Coming Soon)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Accent Color</label>
            <div className="grid grid-cols-6 gap-3">
              {['blue', 'green', 'purple', 'red', 'orange', 'pink'].map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      appearance: { ...prev.appearance, accentColor: color },
                    }))
                  }
                  className={`h-10 rounded-lg border-2 ${
                    settings.appearance.accentColor === color
                      ? 'border-white'
                      : 'border-transparent'
                  }`}
                  style={{
                    backgroundColor:
                      color === 'blue'
                        ? '#0EA5E9'
                        : color === 'green'
                        ? '#22C55E'
                        : color === 'purple'
                        ? '#A855F7'
                        : color === 'red'
                        ? '#EF4444'
                        : color === 'orange'
                        ? '#F59E0B'
                        : '#EC4899',
                  }}
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
                settings.appearance.compactMode ? 'bg-primary-600' : 'bg-gray-700'
              }`}
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
          <div className="rounded-lg bg-primary-500/10 p-2">
            <Database className="h-5 w-5 text-primary-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Docker Settings</h2>
            <p className="text-sm text-gray-400">Configure container runtime behavior</p>
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
                settings.docker.autoStart ? 'bg-primary-600' : 'bg-gray-700'
              }`}
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
                settings.docker.autoStop ? 'bg-primary-600' : 'bg-gray-700'
              }`}
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
              Max CPU Cores ({settings.docker.maxCpu})
            </label>
            <input
              type="range"
              min="1"
              max="16"
              value={settings.docker.maxCpu}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  docker: { ...prev.docker, maxCpu: parseInt(e.target.value) },
                }))
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Max Memory (GB) ({settings.docker.maxMemory})
            </label>
            <input
              type="range"
              min="1"
              max="32"
              value={settings.docker.maxMemory}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  docker: { ...prev.docker, maxMemory: parseInt(e.target.value) },
                }))
              }
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="rounded-lg bg-warning-500/10 p-2">
            <Zap className="h-5 w-5 text-warning-500" />
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
                  value ? 'bg-primary-600' : 'bg-gray-700'
                }`}
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

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="btn-primary px-8">Save All Settings</button>
      </div>
    </div>
  );
}
