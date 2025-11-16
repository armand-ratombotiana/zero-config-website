import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

const FAQ = () => {
  const { openFaqIndex, toggleFaq } = useStore();

  const faqs = [
    {
      question: 'What OS are supported?',
      answer:
        'macOS, Linux (Ubuntu, Fedora), and Windows 11/10 (WSL2 recommended). Full feature parity is best on native Linux/macOS environments.',
    },
    {
      question: 'Does ZeroConfig require Docker?',
      answer:
        "ZeroConfig supports Docker and Podman. It can also run non-containerized processes for lightweight stacks when containers aren't required.",
    },
    {
      question: 'Is the Rust engine open-source?',
      answer:
        'We offer an open-source core with optional closed-source team features (cloud snapshot store and premium AI assistant). Clear licensing will be provided in the docs.',
    },
    {
      question: 'Can I self-host snapshots?',
      answer:
        'Yes — Enterprise customers can self-host the snapshot store and metadata database with full control over data storage and security.',
    },
    {
      question: 'How secure are snapshots and secrets?',
      answer:
        'Snapshots can be encrypted at rest. Secrets are injected into ephemeral environments and never stored in plaintext in the cloud (configurable per policy).',
    },
    {
      question: 'How does port allocation work?',
      answer:
        'The Rust core detects open ports, binds ephemeral ports, and configures an HTTP proxy and friendly local hostnames to route traffic automatically.',
    },
    {
      question: 'Does ZeroConfig work with monorepos?',
      answer:
        'Yes — it scans workspace manifests and creates per-package environments or a single orchestrated workspace environment based on your needs.',
    },
    {
      question: 'Can I run ZeroConfig in CI?',
      answer:
        'Absolutely — zc ci mode is optimized for headless runs and snapshot replays in CI pipelines, making debugging reproducible.',
    },
    {
      question: 'How much RAM/CPU does ZeroConfig need?',
      answer:
        'Typical setups require 1–4GB RAM for simple stacks; container-heavy stacks may require more depending on services. The Rust core itself is very lightweight.',
    },
    {
      question: 'What languages and tools are supported?',
      answer:
        "Node, Python, Go, Rust, Java, .NET, and community-contributed stack templates for other ecosystems. We're constantly adding more language support.",
    },
    {
      question: 'Where does AI run?',
      answer:
        'AI can run locally with a user-provided model or via our cloud assistant (opt-in). You control data sharing and privacy settings.',
    },
    {
      question: 'How do I get support?',
      answer:
        'Free: community chat and public docs. Pro/Enterprise: email + priority support and SLAs for Enterprise customers with dedicated account managers.',
    },
  ];

  return (
    <section id="faq" className="py-20 md:py-32 bg-card/30">
      <div className="container max-w-4xl">
        <div className="section-header">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">Everything you need to know about ZeroConfig</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-semibold pr-4">{faq.question}</span>
                <motion.svg
                  animate={{ rotate: openFaqIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-5 h-5 text-accent flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>

              <AnimatePresence>
                {openFaqIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 text-muted leading-relaxed">
                      {faq.answer.split('zc ci').map((part, i) =>
                        i === 0 ? (
                          <span key={i}>{part}</span>
                        ) : (
                          <span key={i}>
                            <code className="px-2 py-0.5 rounded bg-white/10 text-accent font-mono text-sm">
                              zc ci
                            </code>
                            {part}
                          </span>
                        )
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
