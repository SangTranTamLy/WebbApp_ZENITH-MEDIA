export function HeroSection() {
  return (
    <section className="hero personal-hero">
      <div className="hero-art" aria-hidden="true">
        <b>PORTFOLIO / 2026</b>
        <span>HO CHI MINH CITY • VIETNAM</span>
        <div className="hero-beam" />
      </div>

      <div className="hero-copy">
        <p className="hero-kicker">
          — T.SANG / FRONTEND DEVELOPER & VISUAL EDITOR
        </p>

        <h1 className="kinetic-title">
          <span className="headline-line">
            I BUILD DIGITAL
          </span>

          <span className="headline-line headline-line--delayed">
            EXPERIENCES
            <em
              className="shimmer-text"
              data-text="THAT MOVE."
            >
              THAT MOVE.
            </em>
          </span>
        </h1>

        <p className="hero-description">
          I combine React and TypeScript product development with cinematic
          editing and motion design—turning complex workflows into interfaces
          that feel clear, fast and memorable.
        </p>

        <div className="hero-actions">
          <a className="hero-primary" href="#development">
            Explore my work ↓
          </a>

          <a
            className="hero-github"
            href="https://github.com/SangTranTamLy"
            target="_blank"
            rel="noreferrer"
          >
            GitHub / SangTranTamLy ↗
          </a>
        </div>
      </div>

      <div className="hero-profile-card">
        <img
          src="https://avatars.githubusercontent.com/u/182103420?v=4"
          alt="T.Sang"
        />

        <div>
          <small>PROFILE 001</small>
          <b>T.SANG</b>
          <span>Developer × Visual Editor</span>
        </div>

        <i>AVAILABLE</i>
      </div>
    </section>
  );
}