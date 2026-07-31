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
      "A point-of-sale platform for managing products, orders, invoices, inventory, shifts, promotions and revenue reports.",
    stack: "React · TypeScript · Node.js · Express",
    href: "https://github.com/SangTranTamLy/pos-system-online",
  },
  {
    label: "LEARNING PRODUCT",
    title: "STUDY ELS",
    description:
      "An English-learning interface featuring flashcards, dictionary tools, translation, quizzes and AI-assisted practice.",
    stack: "Frontend · Product Design",
    href: "https://github.com/SangTranTamLy/Study-ELS",
  },
  {
    label: "PERSONAL PROJECT",
    title: "STUDY DEV",
    description:
      "A personal development portfolio documenting technical skills, experiments and my journey toward full-stack engineering.",
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
          transition={{
            duration: 0.8,
            ease: [0.2, 0.8, 0.2, 1],
          }}
        >
          <div className="profile-orbit">
            <span aria-hidden="true" />

            <img
              src="https://avatars.githubusercontent.com/u/182103420?v=4"
              alt="T.Sang — frontend developer and visual editor"
            />
          </div>
        </motion.div>

        <motion.div
          className="about-copy"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: 0.8,
            delay: 0.1,
            ease: [0.2, 0.8, 0.2, 1],
          }}
        >
          <p className="section-label">01 / ABOUT MYSELF</p>

          <h2 className="about-title">
            T.SANG
            <br />
            <em>DEV × EDITOR.</em>
          </h2>

          <p>
            I’m a final-year Information Technology student based in Ho Chi
            Minh City. I focus on building responsive and accessible web
            experiences with React and TypeScript while developing my
            full-stack engineering skills.
          </p>

          <p>
            My work combines practical product development, technical writing
            and visual storytelling. This portfolio is where I document
            projects, publish technical articles and share reusable code
            snippets.
          </p>

          <div className="skill-cloud" aria-label="Technologies and skills">
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
              View GitHub profile
              <span aria-hidden="true">↗</span>
            </a>

            <a
              className="email-link about-email"
              href="mailto:sangchaubr089@gmail.com?subject=Portfolio%20Contact"
              aria-label="Send an email to T.Sang"
            >
              <span>sangchaubr089@gmail.com</span>
              <i aria-hidden="true">↗</i>
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
        transition={{
          duration: 0.8,
          ease: [0.2, 0.8, 0.2, 1],
        }}
      >
        <div className="github-heading">
          <span>FEATURED DEVELOPMENT PROJECTS</span>

          <p>
            Public repositories and selected learning projects available on
            GitHub.
          </p>
        </div>

        <div className="repo-grid">
          {repositories.map((repository) => (
            <a
              href={repository.href}
              key={repository.title}
              target="_blank"
              rel="noreferrer"
              aria-label={`View ${repository.title} on GitHub`}
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