import { motion } from 'framer-motion';

const Features = () => {
  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" strokeLinejoin="round" />
          <path d="M2 17L12 22L22 17" strokeLinejoin="round" />
          <path d="M2 12L12 17L22 12" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Instant Environment Provisioning',
      description:
        'Provision full environments automatically with one command — language runtimes, SDKs, databases, and background services included. Environments are isolated, reproducible, and reusable.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Rust-Powered Orchestration Core',
      description:
        'A low-latency, memory-safe orchestration engine written in Rust for predictable starts, fast dependency resolution, and minimal overhead on developer machines.',
      accent: true,
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M12 8V16M8 12H16" strokeLinecap="round" />
        </svg>
      ),
      title: 'Automatic SDK & Tool Installer',
      description:
        'ZeroConfig detects your project and automatically installs required SDKs, CLIs, and language managers (nvm, pyenv, rvm) — with safe sandboxing.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6H21M3 12H21M3 18H21" strokeLinecap="round" />
          <circle cx="7" cy="6" r="1" fill="currentColor" />
          <circle cx="7" cy="12" r="1" fill="currentColor" />
          <circle cx="7" cy="18" r="1" fill="currentColor" />
        </svg>
      ),
      title: 'Automatic DB & Service Setup',
      description:
        'Launch Postgres, Redis, Kafka, and more with seed data and admin UI bindings — ready to query from day one.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2V6M12 18V22M22 12H18M6 12H2" strokeLinecap="round" />
        </svg>
      ),
      title: 'Smart Port Allocation',
      description:
        'Avoid port conflicts automatically — ZeroConfig detects used ports and remaps services, exposing friendly URLs and proxy routes for each environment.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 10H20C21.1 10 22 10.9 22 12V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V12C2 10.9 2.9 10 4 10H6" />
          <path d="M12 2L12 14M12 14L8 10M12 14L16 10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Cloud Emulation',
      description:
        'Local emulation of cloud services (S3, SQS, Lambda) for offline-first development and realistic integration testing.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      title: 'Cross-Language Support',
      description:
        'One engine, many languages. Prebuilt stacks for Node, Python, Go, Rust, Java, and .NET with community-contributed stack templates.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M7 6V4C7 2.9 7.9 2 9 2H15C16.1 2 17 2.9 17 4V6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
      title: 'Zero-drift Reproducibility',
      description:
        'Share environment snapshots that reproduce the exact runtime — perfect for PRs, CI debugging, and onboarding.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M12 17V21M6 21H18" strokeLinecap="round" />
        </svg>
      ),
      title: 'CLI + Desktop + Web UI',
      description:
        'Control ZeroConfig how you like: a fast CLI for keyboard-first workflows, a lightweight Tauri desktop app, and a browser-based UI for team visibility.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12H12V8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="16" cy="8" r="3" fill="currentColor" />
        </svg>
      ),
      title: 'AI Assistant for Environment Fixes',
      description:
        'AI-driven diagnostics detect broken dependencies and propose fixes (patch versions, missing env vars, port rebinds) — with one-click apply.',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-32">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Everything you need to ship faster</h2>
          <p className="section-subtitle">
            Production-grade developer environments with zero configuration
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-xl p-6 hover:bg-white/10 transition-all group cursor-pointer"
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                  feature.accent
                    ? 'bg-gradient-to-br from-accent to-accent-purple text-white'
                    : 'bg-white/10 text-accent group-hover:text-accent-purple'
                } transition-colors`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-muted leading-relaxed">{feature.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
