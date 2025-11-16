import { motion } from 'framer-motion';

const Testimonials = () => {
  const testimonials = [
    {
      quote:
        'ZeroConfig cut our onboarding time from days to minutes. We ship features faster because new devs can run the exact environment from day one.',
      author: 'Aisha Rahman',
      title: 'Senior Backend Engineer, MotionLab',
      avatar: 'AR',
    },
    {
      quote: "The Rust engine is shockingly fast. It detects stack issues before developers even pull their hair out.",
      author: 'Daniel Kim',
      title: 'DevOps Lead, EdgeNet',
      avatar: 'DK',
    },
    {
      quote: 'I use the CLI daily — the AI assistant suggested a fix for a flaky DB seed that saved me hours.',
      author: 'Priya Singh',
      title: 'Full-Stack Engineer, Acme',
      avatar: 'PS',
    },
    {
      quote:
        "We run ZeroConfig in CI and use snapshots for PR replays. It's made debugging reproducible across the board.",
      author: 'Omar El-Badry',
      title: 'CTO, CloudForge',
      avatar: 'OE',
    },
    {
      quote: 'Smart port allocation and automatic SDK installs are tiny features that compound into massive productivity gains.',
      author: 'Lucas Martins',
      title: 'Senior Engineer, DevHouse',
      avatar: 'LM',
    },
    {
      quote: "ZeroConfig's desktop app is lightweight and polished — perfect for non-CLI folks on the team.",
      author: 'Hana Novak',
      title: 'Developer Advocate, OpenSource Co.',
      avatar: 'HN',
    },
  ];

  return (
    <section id="testimonials" className="py-20 md:py-32">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Loved by Developers</h2>
          <p className="section-subtitle">See what teams are saying about ZeroConfig</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-xl p-6 hover:bg-white/10 transition-colors"
            >
              <div className="text-4xl text-accent mb-4">"</div>
              <p className="text-muted mb-6 leading-relaxed">{testimonial.quote}</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-purple flex items-center justify-center font-bold text-white">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted">{testimonial.title}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
