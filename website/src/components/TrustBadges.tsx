import { motion } from 'framer-motion';

const TrustBadges = () => {
  const logos = ['Acme', 'MotionLab', 'CloudForge', 'EdgeNet', 'DevHouse'];

  return (
    <section className="py-12 border-t border-white/5">
      <div className="container">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted mb-8"
        >
          Trusted by 1000+ dev teams
        </motion.p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {logos.map((logo, index) => (
            <motion.div
              key={logo}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-xl md:text-2xl font-bold text-muted/50 hover:text-muted transition-colors cursor-pointer"
            >
              {logo}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
