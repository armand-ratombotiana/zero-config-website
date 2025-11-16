import { motion } from 'framer-motion';

const CTA = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center glass rounded-2xl p-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Ready to eliminate setup time?
          </h2>
          <p className="text-xl text-muted mb-8">
            Join 1000+ dev teams shipping faster with ZeroConfig
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
            <a href="#" className="btn-ghost btn-large">
              View Documentation
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
