import { motion } from 'framer-motion';

const Architecture = () => {
  return (
    <section id="architecture" className="py-20 md:py-32">
      <div class="container">
        <div className="section-header">
          <h2 className="section-title">Engineered for Performance</h2>
          <p className="section-subtitle">Rust-powered core with modular architecture</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          {/* Top Layer - Interfaces */}
          <div className="flex justify-center gap-4 mb-8">
            {[
              { icon: '💻', label: 'CLI' },
              { icon: '🖥️', label: 'Desktop (Tauri)' },
              { icon: '🌐', label: 'Web UI' },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-lg px-6 py-4 text-center min-w-[120px]"
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-sm font-medium">{item.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Core Engine */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-accent/20 to-accent-purple/20 border-2 border-accent/50 rounded-xl p-8 mb-8"
          >
            <div className="text-center mb-4">
              <span className="inline-block px-4 py-2 rounded-full bg-accent text-white font-bold text-lg">
                Rust Core Engine
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {['Orchestration', 'Port Manager', 'SDK Resolver', 'Snapshot Manager'].map((feature) => (
                <span key={feature} className="glass rounded-lg px-4 py-2 text-sm font-medium">
                  {feature}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Bottom Layer - Runtime & Services */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Runtime */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="glass rounded-lg p-6"
            >
              <h4 className="text-sm font-bold text-accent mb-4">Runtime</h4>
              <div className="space-y-2">
                <div className="bg-white/5 rounded px-3 py-2 text-sm">Docker/Podman</div>
                <div className="bg-white/5 rounded px-3 py-2 text-sm">Process Supervisor</div>
              </div>
            </motion.div>

            {/* Services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="glass rounded-lg p-6"
            >
              <h4 className="text-sm font-bold text-accent-purple mb-4">Services</h4>
              <div className="grid grid-cols-2 gap-2">
                {['Postgres', 'Redis', 'Kafka', 'S3', 'LocalStack'].map((service) => (
                  <div key={service} className="bg-white/5 rounded px-2 py-1 text-xs text-center">
                    {service}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Storage */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="glass rounded-lg p-6"
            >
              <h4 className="text-sm font-bold text-success mb-4">Storage</h4>
              <div className="space-y-2">
                <div className="bg-white/5 rounded px-3 py-2 text-sm">SQLite</div>
                <div className="bg-white/5 rounded px-3 py-2 text-sm">Cloud Snapshots</div>
              </div>
            </motion.div>
          </div>

          {/* Side Nodes */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
              className="glass rounded-lg p-4 flex items-center gap-3"
            >
              <span className="text-2xl">📁</span>
              <span className="font-medium">Project Workspace</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="glass rounded-lg p-4 flex items-center gap-3"
            >
              <span className="text-2xl">🤖</span>
              <span className="font-medium">AI Assistant</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Architecture;
