import { motion } from "framer-motion";
import { TrackingCard3D } from "../../../../components/ui/TrackingCard3D";

const repositories = [
  {
    label: "FEATURED / FULL-STACK",
    title: "QUICKSERVE POS",
    description: "A point-of-sale platform for managing products, orders, invoices, inventory, shifts, promotions and revenue reports.",
    stack: "React · TypeScript · Node.js · Express",
    href: "https://github.com/SangTranTamLy/pos-system-online",
  },
  {
    label: "LEARNING PRODUCT",
    title: "STUDY ELS",
    description: "An English-learning interface featuring flashcards, dictionary tools, translation, quizzes and AI-assisted practice.",
    stack: "Frontend · Product Design",
    href: "https://github.com/SangTranTamLy/Study-ELS",
  },
  {
    label: "PERSONAL PROJECT",
    title: "STUDY DEV",
    description: "A personal development portfolio documenting technical skills, experiments and my journey toward full-stack engineering.",
    stack: "Portfolio · Web Design",
    href: "https://github.com/SangTranTamLy/Study-DEV",
  },
  {
    label: "MONOREPO",
    title: "ZENITH WORKSPACE",
    description: "This very portfolio. Built with a unified design system and backend architecture.",
    stack: "React · Express · Node.js",
    href: "https://github.com/SangTranTamLy/zenith-workspace",
  }
];

export function ProjectsCode() {
  return (
    <section className="projects-section" id="development">
      <motion.div
        className="github-heading"
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <span>02 / FEATURED PROJECTS</span>
        <p>Public repositories and selected full-stack projects available on GitHub.</p>
      </motion.div>

      <div className="repo-grid-3d">
        {repositories.map((repo, i) => (
          <TrackingCard3D
            href={repo.href}
            key={repo.title}
            className="repo-card-3d"
            target="_blank"
            rel="noreferrer"
            delay={i * 0.1}
          >
            <div className="repo-card-inner">
              <small>{repo.label}</small>
              <h3>{repo.title}</h3>
              <p>{repo.description}</p>
              <span>
                {repo.stack}
                <b aria-hidden="true">↗</b>
              </span>
            </div>
          </TrackingCard3D>
        ))}
      </div>
    </section>
  );
}
