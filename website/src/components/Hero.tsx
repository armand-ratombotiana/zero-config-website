import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section id="hero" className="pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight">
              ZeroConfig — Instant developer environments.{' '}
              <span className="gradient-text">Zero config.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl mx-auto lg:mx-0">
              Spin up full, production-like dev environments automatically — language SDKs, databases, messaging systems, and cloud emulation included. ZeroConfig's Rust core handles orchestration, port allocation, and SDK installs so teams start coding in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6">
              <a href="#" className="btn-primary btn-large group">
                Get Started — Free
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </a>
              <a href="#demo" className="btn-ghost btn-large group">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Watch Demo
              </a>
            </div>

            <p className="text-sm text-muted">
              Works locally, in CI, or on your laptop — CLI, Desktop App, and Web UI included.
            </p>
          </motion.div>

          {/* Visual - Terminal Demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="glass rounded-xl overflow-hidden shadow-2xl">
              {/* Terminal Header */}
              <div className="bg-white/5 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="flex-1 text-center text-sm text-muted">
                  zsh — zeroconfig
                </div>
              </div>

              {/* Terminal Body */}
              <div className="p-6 font-mono text-sm bg-card/50">
                <div className="mb-4">
                  <span className="text-accent">~</span>
                  <span className="text-white ml-2">zc up --stack=node-postgres</span>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <div className="text-success flex items-center gap-2">
                    <span>✅</span>
                    <span>Detected: Node 20.4, npm@9.0</span>
                  </div>
                  <div className="text-blue-400 flex items-center gap-2">
                    <span>📦</span>
                    <span>Installing: node (20.4) — done</span>
                  </div>
                  <div className="text-purple-400 flex items-center gap-2">
                    <span>🐘</span>
                    <span>Launching: postgres:15 — 127.0.0.1:54321</span>
                  </div>
                  <div className="text-cyan-400 flex items-center gap-2">
                    <span>🔁</span>
                    <span>Proxy: app.local.zc → 127.0.0.1:54321</span>
                  </div>
                  <div className="text-success flex items-center gap-2">
                    <span>🎉</span>
                    <span>Environment ready — open http://app.local.zc</span>
                  </div>
                </motion.div>

                <div className="mt-4 flex items-center">
                  <span className="text-accent">~</span>
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="ml-2 text-white"
                  >
                    |
                  </motion.span>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute -right-4 top-20 glass rounded-lg px-4 py-2 text-sm hidden xl:block"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                <span>Auto SDK Install</span>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -left-4 bottom-20 glass rounded-lg px-4 py-2 text-sm hidden xl:block"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                <span>Smart Ports</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
