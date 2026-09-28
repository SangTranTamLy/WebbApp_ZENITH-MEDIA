import { motion } from "framer-motion";

export function ContactCode() {
  return (
    <section className="contact-section" id="contact">
      <motion.div
        className="contact-card"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="contact-header">
          <h2>
            LET'S BUILD
            <br />
            <em>TOGETHER.</em>
          </h2>

          <p>
            Whether it's a full-stack application or a freelance opportunity, 
            feel free to reach out. I'm always open to new challenges.
          </p>

          <a
            className="contact-email"
            href="mailto:sangchaubr089@gmail.com?subject=Portfolio%20Contact"
          >
            sangchaubr089@gmail.com
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="contact-footer">
          <span>© 2026 T.Sang</span>
          <a
            href="https://github.com/SangTranTamLy"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </motion.div>
    </section>
  );
}
