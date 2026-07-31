import { motion } from "framer-motion";

export function ContactSection() {
  return (
    <section id="contact" className="contact-section">
      <motion.p
        className="contact-label"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{
          duration: 0.6,
          ease: [0.2, 0.8, 0.2, 1],
        }}
      >
        HAVE AN IDEA OR OPPORTUNITY?
      </motion.p>

      <motion.h2
        className="contact-title"
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{
          duration: 0.75,
          delay: 0.1,
          ease: [0.2, 0.8, 0.2, 1],
        }}
      >
        <span>LET’S BUILD SOMETHING</span>

        <em
          className="contact-shimmer"
          data-text="WORTH REMEMBERING."
        >
          WORTH REMEMBERING.
        </em>
      </motion.h2>

      <motion.p
        className="contact-description"
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{
          duration: 0.6,
          delay: 0.2,
        }}
      >
        I’m open to internships, freelance projects, collaborations and
        opportunities to build useful digital products.
      </motion.p>

      <motion.div
        className="contact-actions"
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{
          duration: 0.6,
          delay: 0.3,
        }}
      >
        <a
          className="contact-primary"
          href="mailto:sangchaubr089@gmail.com?subject=Portfolio%20Contact"
        >
          <span>CONTACT ME</span>
          <i aria-hidden="true">↗</i>
        </a>

        <a
          className="email-link contact-email"
          href="mailto:sangchaubr089@gmail.com?subject=Portfolio%20Contact"
          aria-label="Send an email to T.Sang"
        >
          <span>sangchaubr089@gmail.com</span>
          <i aria-hidden="true">↗</i>
        </a>
      </motion.div>

      <div className="contact-decoration" aria-hidden="true">
        <span />
        <span />
      </div>
    </section>
  );
}