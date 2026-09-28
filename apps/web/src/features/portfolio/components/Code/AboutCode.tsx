import { motion } from "framer-motion";

const technologies = [
  "React",
  "TypeScript",
  "Node.js",
  "Express",
  "PostgreSQL",
  "Vite",
  "CSS3",
  "Framer Motion"
];

export function AboutCode() {
  return (
    <section className="about-section" id="about">
      <div className="about-profile">
        <motion.div
          className="about-visual"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="profile-orbit">
            <span aria-hidden="true" />
            <motion.img
              src="https://avatars.githubusercontent.com/u/182103420?v=4"
              alt="T.Sang — frontend developer"
              whileHover={{ rotateX: -10, rotateY: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              style={{ transformStyle: "preserve-3d" }}
            />
          </div>
        </motion.div>

        <motion.div
          className="about-copy"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <p className="section-label">01 / ABOUT MYSELF</p>

          <h2 className="about-title">
            T.SANG
            <br />
            <em>FULL-STACK DEV.</em>
          </h2>

          <p>
            I’m a final-year Information Technology student based in Ho Chi Minh City. 
            I focus on building robust, scalable web applications with React, Node.js, and TypeScript.
          </p>
          <p>
            My work combines logical problem-solving with a passion for clean, maintainable architecture.
          </p>

          <div className="skill-cloud-3d" aria-label="Technologies and skills">
            {technologies.map((tech) => (
              <motion.div 
                key={tech}
                className="tech-icon-3d"
                whileHover={{ rotateX: 15, rotateY: -15, scale: 1.15, z: 20 }}
                transition={{ type: "spring", stiffness: 300 }}
                style={{ transformStyle: "preserve-3d", perspective: 800 }}
              >
                <span>{tech}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
