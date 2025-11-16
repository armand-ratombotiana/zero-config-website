import { motion } from 'framer-motion';

const Comparison = () => {
  const data = [
    {
      feature: 'Developer productivity',
      zeroconfig: { grade: 'A', text: 'Instant envs, snapshots' },
      docker: { grade: 'C', text: 'Manual setup' },
      compose: { grade: 'B', text: 'Some automation' },
      manual: { grade: 'D', text: 'Very slow' },
    },
    {
      feature: 'Automation level',
      zeroconfig: { grade: 'A', text: 'Auto SDKs, seeds, ports' },
      docker: { grade: 'C', text: 'Manual config' },
      compose: { grade: 'B', text: 'Partial' },
      manual: { grade: 'D', text: 'All manual' },
    },
    {
      feature: 'Cross-language support',
      zeroconfig: { grade: 'A', text: 'All major languages' },
      docker: { grade: 'C', text: 'Container-only' },
      compose: { grade: 'C', text: 'Container-only' },
      manual: { grade: 'B', text: 'Language-specific' },
    },
    {
      feature: 'Environment reproducibility',
      zeroconfig: { grade: 'A', text: 'Snapshots & CI replay' },
      docker: { grade: 'B', text: 'Image-based' },
      compose: { grade: 'B', text: 'Compose files' },
      manual: { grade: 'D', text: 'Docs only' },
    },
    {
      feature: 'Ease of onboarding',
      zeroconfig: { grade: 'A', text: 'One command' },
      docker: { grade: 'C', text: 'Steep learning' },
      compose: { grade: 'C', text: 'YAML complexity' },
      manual: { grade: 'D', text: 'Hours/days' },
    },
    {
      feature: 'Local cloud emulation',
      zeroconfig: { grade: 'A', text: 'Built-in S3, SQS, Lambda' },
      docker: { grade: 'C', text: 'Manual setup' },
      compose: { grade: 'C', text: 'Manual setup' },
      manual: { grade: 'D', text: 'Not included' },
    },
  ];

  const gradeColors = {
    A: 'bg-success text-white',
    B: 'bg-blue-500 text-white',
    C: 'bg-yellow-500 text-white',
    D: 'bg-danger text-white',
  };

  return (
    <section id="comparison" className="py-20 md:py-32">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Why Choose ZeroConfig?</h2>
          <p className="section-subtitle">See how we compare to traditional tools</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-x-auto"
        >
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-4 px-4 font-semibold text-muted">Feature</th>
                <th className="py-4 px-4 font-semibold text-center bg-accent/10">ZeroConfig</th>
                <th className="py-4 px-4 font-semibold text-center text-muted">Docker</th>
                <th className="py-4 px-4 font-semibold text-center text-muted">Docker Compose</th>
                <th className="py-4 px-4 font-semibold text-center text-muted">Manual Setup</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <motion.tr
                  key={row.feature}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-4 font-medium">{row.feature}</td>
                  <td className="py-4 px-4 bg-accent/5">
                    <div className="flex flex-col items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${gradeColors[row.zeroconfig.grade as keyof typeof gradeColors]}`}>
                        {row.zeroconfig.grade}
                      </span>
                      <span className="text-xs text-center">{row.zeroconfig.text}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${gradeColors[row.docker.grade as keyof typeof gradeColors]}`}>
                        {row.docker.grade}
                      </span>
                      <span className="text-xs text-muted text-center">{row.docker.text}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${gradeColors[row.compose.grade as keyof typeof gradeColors]}`}>
                        {row.compose.grade}
                      </span>
                      <span className="text-xs text-muted text-center">{row.compose.text}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${gradeColors[row.manual.grade as keyof typeof gradeColors]}`}>
                        {row.manual.grade}
                      </span>
                      <span className="text-xs text-muted text-center">{row.manual.text}</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted mt-8 max-w-3xl mx-auto"
        >
          <strong>Note:</strong> ZeroConfig complements Docker — it uses container runtimes but removes the repetitive
          wiring and developer friction.
        </motion.p>
      </div>
    </section>
  );
};

export default Comparison;
