import { motion } from "framer-motion";

const projects = [
  {
    number: "01",
    title: "Zenith Media Workspace",
    category: "Full-stack Web Application",
    description:
      "A portfolio and media asset management platform that connects client booking, large-file delivery, video review, payments and production workflows.",
    technologies: ["React", "TypeScript", "Express", "PostgreSQL"],
    theme: "cyan",
    status: "IN DEVELOPMENT",
  },
  {
    number: "02",
    title: "Video Review System",
    category: "Product Feature",
    description:
      "A collaborative video player where clients can leave time-stamped comments, review draft versions and approve final deliveries.",
    technologies: ["React Query", "S3", "CloudFront", "WebSocket"],
    theme: "purple",
    status: "PLANNED",
  },
  {
    number: "03",
    title: "Creative Motion Archive",
    category: "Portfolio Experience",
    description:
      "An interactive showcase for motion design, video editing and before-and-after visual effects with cinematic transitions.",
    technologies: ["Framer Motion", "Video", "WebGL", "CDN"],
    theme: "lime",
    status: "CONCEPT",
  },
];

export function FeaturedProjectsSection() {
  return (
    <section id="development" className="projects-section">
      <motion.div
        className="projects-heading"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
      >
        <div>
          <p className="section-index">02 / SELECTED WORK</p>
          <h2>FEATURED PROJECTS</h2>
        </div>

        <p>
          A selection of products and creative systems where technology,
          workflow and visual design come together.
        </p>
      </motion.div>

      <div className="projects-list">
        {projects.map((project, index) => (
          <motion.article
            className={`project-card project-card--${project.theme}`}
            key={project.title}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.7,
              delay: index * 0.1,
            }}
          >
            <div className="project-content">
              <div className="project-meta">
                <span>{project.number}</span>
                <span>{project.category}</span>
                <span>{project.status}</span>
              </div>

              <h3>{project.title}</h3>
              <p>{project.description}</p>

              <ul className="project-technologies">
                {project.technologies.map((technology) => (
                  <li key={technology}>{technology}</li>
                ))}
              </ul>

              <a
                className="project-link"
                href={
                  project.number === "01"
                    ? "https://github.com/SangTranTamLy"
                    : "#platform"
                }
                target={project.number === "01" ? "_blank" : undefined}
                rel={project.number === "01" ? "noreferrer" : undefined}
              >
                {project.number === "01"
                  ? "View development"
                  : "Explore concept"}
                <span aria-hidden="true">↗</span>
              </a>
            </div>

            <div className="project-preview" aria-hidden="true">
              <div className="preview-window">
                <div className="preview-toolbar">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="preview-layout">
                  <div className="preview-sidebar">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className="preview-main">
                    <div className="preview-title" />
                    <div className="preview-subtitle" />

                    <div className="preview-cards">
                      <div />
                      <div />
                    </div>

                    <div className="preview-timeline">
                      <span />
                    </div>
                  </div>
                </div>
              </div>

              <span className="preview-glow" />
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}