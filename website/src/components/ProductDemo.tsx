import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

const ProductDemo = () => {
  const { activeDemoTab, setActiveDemoTab } = useStore();

  const tabs = [
    { id: 'cli', label: 'CLI' },
    { id: 'desktop', label: 'Desktop App' },
    { id: 'web', label: 'Web UI' },
  ] as const;

  return (
    <section id="demo" className="py-20 md:py-32 bg-card/30">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Built for Every Workflow</h2>
          <p className="section-subtitle">CLI, Desktop, or Web — use what works best for you</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex glass rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDemoTab(tab.id)}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeDemoTab === tab.id
                    ? 'bg-accent text-white shadow-lg'
                    : 'text-muted hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeDemoTab === 'cli' && (
              <motion.div
                key="cli"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid md:grid-cols-2 gap-8 items-center"
              >
                {/* Terminal */}
                <div className="glass rounded-xl overflow-hidden">
                  <div className="bg-white/5 px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="flex-1 text-center text-sm text-muted">Terminal — zeroconfig</div>
                  </div>
                  <div className="p-6 font-mono text-sm bg-card/50">
                    <div className="mb-2">
                      <span className="text-accent">~</span>
                      <span className="text-white ml-2">zc up --stack=node-postgres</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="text-success">✅ Detected: Node 20.4, npm@9.0</div>
                      <div className="text-blue-400">📦 Installing: node (20.4) — done</div>
                      <div className="text-purple-400">🐘 Launching: postgres:15 — 127.0.0.1:54321</div>
                      <div className="text-cyan-400">🔁 Proxy: app.local.zc → 127.0.0.1:54321</div>
                      <div className="text-success">🎉 Environment ready — open http://app.local.zc</div>
                    </div>
                    <div className="mt-2">
                      <span className="text-accent">~</span>
                      <span className="text-white ml-2 animate-pulse">|</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-2xl font-bold mb-4">Lightning-fast CLI</h3>
                  <p className="text-muted mb-6">
                    Keyboard-first workflows for developers who live in the terminal. Auto-completion,
                    colorized output, and instant feedback.
                  </p>
                  <ul className="space-y-3">
                    {['One-command environment setup', 'Real-time progress indicators', 'Smart auto-completion'].map(
                      (item) => (
                        <li key={item} className="flex items-center gap-2 text-muted">
                          <span className="text-success">✓</span>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </motion.div>
            )}

            {activeDemoTab === 'desktop' && (
              <motion.div
                key="desktop"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid md:grid-cols-2 gap-8 items-center"
              >
                {/* Desktop App */}
                <div className="glass rounded-xl overflow-hidden">
                  <div className="bg-white/5 px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="flex-1 text-center text-sm text-muted">ZeroConfig Desktop</div>
                  </div>
                  <div className="flex bg-card/50">
                    <div className="w-1/3 bg-white/5 p-4 space-y-2">
                      <div className="flex items-center gap-2 bg-accent/20 rounded px-3 py-2 text-sm">
                        <span>📦</span> Projects
                      </div>
                      <div className="flex items-center gap-2 rounded px-3 py-2 text-sm text-muted">
                        <span>🔧</span> Stacks
                      </div>
                      <div className="flex items-center gap-2 rounded px-3 py-2 text-sm text-muted">
                        <span>📸</span> Snapshots
                      </div>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="glass rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold">SpreadsheetAPI</h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success">● Running</span>
                        </div>
                        <div className="text-xs text-muted mb-3">Node 20 • Postgres 15 • Redis</div>
                        <div className="flex gap-2">
                          <button className="btn-primary btn-small text-xs">Open</button>
                          <button className="btn-ghost btn-small text-xs">Logs</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-2xl font-bold mb-4">Beautiful Desktop App</h3>
                  <p className="text-muted mb-6">
                    Lightweight Tauri-based desktop app with visual controls and quick onboarding. Perfect for teams who
                    want visual feedback.
                  </p>
                  <ul className="space-y-3">
                    {['Visual environment management', 'One-click service URLs', 'Real-time logs & metrics'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-muted">
                        <span className="text-success">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {activeDemoTab === 'web' && (
              <motion.div
                key="web"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid md:grid-cols-2 gap-8 items-center"
              >
                {/* Browser */}
                <div className="glass rounded-xl overflow-hidden">
                  <div className="bg-white/5 px-4 py-2 flex items-center gap-2">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="flex-1 text-center bg-white/5 rounded px-3 py-1 text-xs text-muted">
                      app.zeroconfig.dev/dashboard
                    </div>
                  </div>
                  <div className="p-6 bg-card/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-sm">Team Environments</h4>
                      <button className="btn-primary btn-small text-xs">New Environment</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: 'API Gateway', stack: 'Go • Postgres • Redis' },
                        { name: 'Frontend App', stack: 'Node 20 • S3-emu' },
                      ].map((env) => (
                        <div key={env.name} className="glass rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-xs">{env.name}</h5>
                            <span className="w-2 h-2 rounded-full bg-success"></span>
                          </div>
                          <div className="text-xs text-muted">{env.stack}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-2xl font-bold mb-4">Team Web Dashboard</h3>
                  <p className="text-muted mb-6">
                    Browser-based UI for team visibility, snapshot sharing, and collaborative debugging. Manage environments
                    from anywhere.
                  </p>
                  <ul className="space-y-3">
                    {['Team workspace & snapshots', 'One-click CI replay', 'Real-time collaboration'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-muted">
                        <span className="text-success">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default ProductDemo;
