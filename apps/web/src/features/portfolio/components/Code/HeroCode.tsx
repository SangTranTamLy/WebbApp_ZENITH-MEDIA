import { motion } from "framer-motion";

export function HeroCode() {
  return (
    <section id="home" className="hero personal-hero">
      <div className="hero-art" aria-hidden="true">
        <b>PORTFOLIO / 2026</b>
        <span>HO CHI MINH CITY • VIETNAM</span>
        <div className="hero-beam" />
      </div>

      <div className="hero-copy">
        <p className="hero-kicker">
          — T.SANG / FULL-STACK DEVELOPER
        </p>

        <h1 className="hero-title">
          <span className="hero-title-line">
            I BUILD
          </span>
          <span className="hero-title-line hero-title-line--delayed">
            DIGITAL PRODUCTS
            <em className="hero-shimmer" data-text="WITH MOTION.">
              WITH DEPTH.
            </em>
          </span>
        </h1>

        <p className="hero-description">
          I build web products using React, TypeScript, and Express, focusing on scalable architecture, clean code, and engaging user experiences.
        </p>

        <div className="hero-actions">
          <a className="hero-primary" href="#development">
            View Projects
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>

      <motion.div 
        className="hero-profile-card hover-3d"
        whileHover={{ rotateX: 10, rotateY: -15, scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <img
          src="https://avatars.githubusercontent.com/u/182103420?v=4"
          alt="Avatar of T.Sang"
        />
        <div>
          <small>PROFILE 001</small>
          <b>T.SANG</b>
          <span>Full-stack Developer</span>
        </div>
        <i>READY</i>
      </motion.div>
    </section>
  );
}
