import { motion } from "framer-motion";

const technologies = [
  "React",
  "TypeScript",
  "Node.js",
  "Express",
  "PostgreSQL",
  "Motion Design",
];

const repositories = [
  {
    label: "FEATURED / FULL-STACK",
    title: "QUICKSERVE POS",
    description:
      "A point-of-sale platform for products, orders, invoices, inventory, shifts, promotions and revenue reporting.",
    stack: "React · TypeScript · Node · Express",
    href: "https://github.com/SangTranTamLy/pos-system-online",
  },
  {
    label: "LEARNING PRODUCT",
    title: "STUDY ELS",
    description:
      "An English-learning interface with flashcards, dictionary, translation, quizzes and AI-assisted practice.",
    stack: "Frontend · Product Design",
    href: "https://github.com/SangTranTamLy/Study-ELS",
  },
  {
    label: "PERSONAL PROJECT",
    title: "STUDY DEV",
    description:
      "A personal development portfolio documenting technical skills, experiments and the journey toward full-stack engineering.",
    stack: "Portfolio · Web Design",
    href: "https://github.com/SangTranTamLy/Study-DEV",
  },
];

export function AboutSection() {
  return (
    <section className="about-section" id="about">
      <div className="about-profile">
        <motion.div
          className="about-visual"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <div className="profile-orbit">
            <span />

            <img
              src="https://avatars.githubusercontent.com/u/182103420?v=4"
              alt="T.Sang — SangTranTamLy on GitHub"
            />
          </div>
        </motion.div>

        <motion.div
          className="about-copy"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <p className="section-label">01 / ABOUT MYSELF</p>

          <h2 className="about-title">
            T.SANG
            <br />
            <em>DEV × EDITOR.</em>
          </h2>

          <p>
            I’m a final-year Information Technology student based in Ho Chi
            Minh City, focused on building responsive web experiences with
            React and TypeScript while developing toward full-stack
            engineering.
          </p>

          <p>
            My work connects practical product development with cinematic
            visual storytelling. Zenith is where these strengths become one
            complete client experience.
          </p>

          <div className="skill-cloud">
            {technologies.map((technology) => (
              <span key={technology}>{technology}</span>
            ))}
          </div>

          <div className="about-actions">
            <a
              className="about-primary"
              href="https://github.com/SangTranTamLy"
              target="_blank"
              rel="noreferrer"
            >
              View GitHub profile ↗
            </a>

            <a
              className="profile-mail"
              href="mailto:sangchaubr089@gmail.com"
            >
              sangchaubr089@gmail.com
            </a>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="github-work"
        id="development"
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8 }}
      >
        <div className="github-heading">
          <span>FEATURED DEVELOPMENT PROJECTS</span>
          <p>Public repositories and learning projects on GitHub.</p>
        </div>

        <div className="repo-grid">
          {repositories.map((repository) => (
            <a
              href={repository.href}
              key={repository.title}
              target="_blank"
              rel="noreferrer"
            >
              <small>{repository.label}</small>
              <h3>{repository.title}</h3>
              <p>{repository.description}</p>

              <span>
                {repository.stack}
                <b aria-hidden="true">↗</b>
              </span>
            </a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}