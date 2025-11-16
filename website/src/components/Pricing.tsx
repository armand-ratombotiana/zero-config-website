import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

const Pricing = () => {
  const { isAnnualPricing, togglePricing } = useStore();

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, annual: 0 },
      period: '/forever',
      description: 'For hobbyists and individual developers',
      features: [
        'Local Rust core binary',
        'CLI + Desktop app',
        'Up to 3 active stacks',
        'Local snapshots (unencrypted)',
        'Community support',
      ],
      cta: 'Start Free',
      highlight: false,
    },
    {
      name: 'Pro',
      price: { monthly: 12, annual: 10 },
      period: '/user/month',
      description: 'For dev teams and freelancers',
      features: [
        'Everything in Free',
        'Unlimited active stacks',
        'Team workspace & shared snapshots',
        '50 GB encrypted cloud storage',
        'Priority email support',
        'AI Assistant quotas',
        'Single sign-on (OAuth)',
      ],
      cta: 'Start Pro Trial',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: { monthly: null, annual: null },
      customPrice: 'Custom',
      period: '',
      description: 'For companies and regulated industries',
      features: [
        'Everything in Pro',
        'On-prem / self-hosting',
        'SSO + SCIM provisioning',
        'Dedicated SLA & uptime',
        'Account manager',
        'Compliance & audit logs',
        '24/7 premium support',
      ],
      cta: 'Contact Sales',
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-32 bg-card/30">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Simple, Transparent Pricing</h2>
          <p className="section-subtitle">Start free, scale as you grow</p>
        </div>

        {/* Pricing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm ${!isAnnualPricing ? 'text-white font-semibold' : 'text-muted'}`}>Monthly</span>
          <button
            onClick={togglePricing}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              isAnnualPricing ? 'bg-accent' : 'bg-white/20'
            }`}
            aria-label="Toggle pricing"
          >
            <motion.div
              className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full"
              animate={{ x: isAnnualPricing ? 28 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-sm ${isAnnualPricing ? 'text-white font-semibold' : 'text-muted'}`}>
            Annual
            <span className="ml-2 px-2 py-1 rounded-full bg-success/20 text-success text-xs">Save 20%</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-xl p-8 ${
                plan.highlight
                  ? 'bg-gradient-to-br from-accent/20 to-accent-purple/20 border-2 border-accent'
                  : 'glass'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-accent text-white text-sm font-semibold">Most Popular</span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  {plan.customPrice ? (
                    <span className="text-4xl font-bold">{plan.customPrice}</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">
                        ${isAnnualPricing ? plan.price.annual : plan.price.monthly}
                      </span>
                      <span className="text-muted">{plan.period}</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <span className="text-success mt-1">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#"
                className={`btn btn-block ${plan.highlight ? 'btn-primary' : 'btn-ghost'}`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
