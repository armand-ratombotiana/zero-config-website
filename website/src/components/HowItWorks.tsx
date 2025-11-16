import { motion } from 'framer-motion';

const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      title: 'Detect & Analyze',
      description:
        'Run zc init or open the repo in Desktop App — ZeroConfig detects your project type, dependencies, and required services.',
      icon: (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="35" stroke="url(#gradient1)" strokeWidth="2" fill="none" strokeDasharray="4,4" />
          <path d="M35 50L45 60L65 40" stroke="#FF6A00" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="35" cy="35" r="4" fill="#7C5CFF" />
          <circle cx="65" cy="35" r="4" fill="#FF6A00" />
          <circle cx="65" cy="65" r="4" fill="#00C48C" />
        </svg>
      ),
    },
    {
      number: '02',
      title: 'Provision & Configure',
      description:
        'The Rust core orchestrates containers/Podman, installs SDKs, seeds databases, allocates ports, and sets up local cloud emulation automatically.',
      icon: (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="35" stroke="url(#gradient2)" strokeWidth="2" fill="none" strokeDasharray="4,4" />
          <rect x="35" y="35" width="12" height="12" rx="2" stroke="#7C5CFF" strokeWidth="3" fill="none" />
          <rect x="53" y="35" width="12" height="12" rx="2" stroke="#FF6A00" strokeWidth="3" fill="none" />
          <rect x="35" y="53" width="12" height="12" rx="2" stroke="#00C48C" strokeWidth="3" fill="none" />
          <rect x="53" y="53" width="12" height="12" rx="2" stroke="#FF6A00" strokeWidth="3" fill="none" />
        </svg>
      ),
    },
    {
      number: '03',
      title: 'Share & Collaborate',
      description:
        'Export reproducible snapshots, share a preview link, or run the same environment in CI — teammates get identical setups.',
      icon: (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="35" stroke="url(#gradient3)" strokeWidth="2" fill="none" strokeDasharray="4,4" />
          <circle cx="50" cy="50" r="20" stroke="#00C48C" strokeWidth="3" fill="none" />
          <circle cx="35" cy="40" r="7" fill="#7C5CFF" opacity="0.6" />
          <circle cx="65" cy="40" r="7" fill="#FF6A00" opacity="0.6" />
          <circle cx="50" cy="65" r="7" fill="#00C48C" opacity="0.6" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-card/30">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">From zero to production-ready in three simple steps</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-4 relative">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative z-10"
              >
                {/* Icon */}
                <div className="w-32 h-32 mx-auto mb-6">
                  {step.icon}
                </div>

                {/* Number */}
                <div className="text-center mb-4">
                  <span className="text-5xl font-bold gradient-text">{step.number}</span>
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-3 text-white">{step.title}</h3>
                  <p className="text-muted leading-relaxed">
                    {step.description.split('zc init').map((part, i) =>
                      i === 0 ? (
                        <span key={i}>{part}</span>
                      ) : (
                        <span key={i}>
                          <code className="px-2 py-1 rounded bg-white/10 text-accent font-mono text-sm">
                            zc init
                          </code>
                          {part}
                        </span>
                      )
                    )}
                  </p>
                </div>
              </motion.div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-1/2 w-full h-1">
                  <svg className="w-full h-full" preserveAspectRatio="none">
                    <line
                      x1="50%"
                      y1="0"
                      x2="100%"
                      y2="0"
                      stroke="url(#lineGradient)"
                      strokeWidth="2"
                      strokeDasharray="8,4"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* SVG Gradients */}
        <svg className="w-0 h-0">
          <defs>
            <linearGradient id="gradient1">
              <stop offset="0%" stopColor="#FF6A00" />
              <stop offset="100%" stopColor="#7C5CFF" />
            </linearGradient>
            <linearGradient id="gradient2">
              <stop offset="0%" stopColor="#7C5CFF" />
              <stop offset="100%" stopColor="#00C48C" />
            </linearGradient>
            <linearGradient id="gradient3">
              <stop offset="0%" stopColor="#00C48C" />
              <stop offset="100%" stopColor="#FF6A00" />
            </linearGradient>
            <linearGradient id="lineGradient">
              <stop offset="0%" stopColor="#FF6A00" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#7C5CFF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00C48C" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
};

export default HowItWorks;
