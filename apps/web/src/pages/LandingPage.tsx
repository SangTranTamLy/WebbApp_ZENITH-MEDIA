import { ArrowRight, Code2, Film, Layers, Sparkles, Terminal } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useRef, useState, type MouseEvent } from "react";
import { SiReact, SiTypescript, SiWondersharefilmora } from "react-icons/si";
import { Link } from "react-router-dom";

type PathKey = "code" | "editor";

interface PathConfig {
  key: PathKey;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  link: string;
  className: string;
  icons: { id: string; node: React.ReactNode }[];
}

const PATHS: PathConfig[] = [
  {
    key: "code",
    eyebrow: "Engineering",
    title: "CODE",
    description: "Full-stack systems, typed interfaces and performant architecture — built to scale from prototype to production.",
    cta: "Explore Development",
    link: "/code",
    className: "path-code",
    icons: [
      { id: "react", node: <SiReact /> },
      { id: "typescript", node: <SiTypescript /> },
      { id: "terminal", node: <Terminal /> },
      { id: "code", node: <Code2 /> },
    ],
  },
  {
    key: "editor",
    eyebrow: "Post-Production",
    title: "EDITOR",
    description: "Motion design, colour and rhythm — cutting footage into stories with cinematic pacing and sound.",
    cta: "Explore Motion",
    link: "/editor",
    className: "path-editor",
    icons: [
      { id: "filmora", node: <SiWondersharefilmora /> },
      { id: "film", node: <Film /> },
      { id: "layers", node: <Layers /> },
      { id: "sparkles", node: <Sparkles /> },
    ],
  },
];

function AmbientBackground() {
  return (
    <div aria-hidden="true" className="lp-ambient-bg">
      <div className="lp-bg-noise" />
      <div className="lp-bg-dot-grid" />
      <div className="lp-orb lp-orb-left" />
      <div className="lp-orb lp-orb-right" />
      <div className="lp-scanline" />
    </div>
  );
}

function Header() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="lp-header-v2"
    >
      <div className="lp-header-brand">
        <Link className="public-brand" to="/">
          <span className="public-brand-mark" aria-hidden="true" />
          <strong>ZENITH</strong>
        </Link>
        <span className="lp-header-subtitle">Creative Studio</span>
      </div>
    </motion.header>
  );
}

const HEADLINE_LINES = [
  { id: "line-one", text: "Two paths.", className: "lp-text-metal" },
  { id: "line-two", text: "One vision.", className: "lp-text-gradient-spectrum" },
];

function Hero() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="lp-hero-v2">
      <h1 className="lp-hero-headline">
        {HEADLINE_LINES.map((line, index) => (
          <span key={line.id} className="lp-hero-line-wrap">
            <motion.span
              initial={reduceMotion ? false : { y: "110%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{
                duration: 0.9,
                delay: 0.15 + index * 0.14,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`lp-hero-line ${line.className}`}
            >
              {line.text}
            </motion.span>
          </span>
        ))}
      </h1>
      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="lp-hero-sub-v2"
      >
        Code meets cinema.
      </motion.p>
    </section>
  );
}

interface PathCardProps {
  config: PathConfig;
  isDimmed: boolean;
  isHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

function PathCard({ config, isDimmed, isHovered, onHoverStart, onHoverEnd }: PathCardProps) {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLAnchorElement>(null);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 18, mass: 0.6 };
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [12, -12]), springConfig);
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-12, 12]), springConfig);

  function handlePointerMove(event: MouseEvent<HTMLAnchorElement>) {
    if (reduceMotion) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handlePointerLeave() {
    pointerX.set(0);
    pointerY.set(0);
    onHoverEnd();
  }

  return (
    <div className="lp-card-wrapper-v2">
      <motion.a
        ref={cardRef}
        href={config.link}
        onMouseMove={handlePointerMove}
        onMouseEnter={onHoverStart}
        onMouseLeave={handlePointerLeave}
        style={{ rotateX, rotateY }}
        animate={{
          scale: isDimmed ? 0.97 : 1,
          opacity: isDimmed ? 0.45 : 1,
          filter: isDimmed ? "saturate(0.5) brightness(0.7)" : "saturate(1) brightness(1)",
        }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className={`lp-card-v2 ${config.className}`}
      >
        <div className="lp-card-bg-mask" aria-hidden="true">
          <div className="lp-card-glow" />
          <div className="lp-card-icons">
            {config.icons.map((icon) => (
              <span key={icon.id}>{icon.node}</span>
            ))}
          </div>
        </div>

        <div className="lp-card-content">
          <div>
            <span className="lp-card-eyebrow">{config.eyebrow}</span>
            <h2 className="lp-card-title-v2">{config.title}</h2>
            <p className="lp-card-desc-v2">{config.description}</p>
          </div>

          <div className="lp-card-cta-wrap">
            <motion.div
              initial={false}
              animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="lp-card-cta-btn"
            >
              {config.cta}
              <ArrowRight aria-hidden="true" />
            </motion.div>
          </div>
        </div>
      </motion.a>
    </div>
  );
}

function AiAssistantPromo() {
  const reduceMotion = useReducedMotion();
  
  return (
    <section className="lp-ai-promo">
      <motion.div 
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="lp-ai-promo-inner"
      >
        <div className="lp-ai-promo-bg" aria-hidden="true">
          <div className="lp-ai-promo-glow" />
          <div className="lp-ai-promo-grid" />
        </div>
        
        <div className="lp-ai-promo-content">
          <div className="lp-ai-promo-badge">
            <Sparkles aria-hidden="true" />
            <span>Zenith AI Engine</span>
          </div>
          
          <h2 className="lp-ai-promo-title">
            Meet <span className="lp-text-gradient-primary">MDA Assistant</span>
          </h2>
          
          <p className="lp-ai-promo-desc">
            An intelligent, context-aware AI trained exclusively on my portfolio, projects, and domain knowledge. Ask deep technical questions, explore my workflow, or just say hi.
          </p>
          
          <div className="lp-ai-promo-features">
            <div className="lp-ai-feature">
              <Terminal aria-hidden="true" />
              <span>Contextual RAG Retrieval</span>
            </div>
            <div className="lp-ai-feature">
              <Layers aria-hidden="true" />
              <span>Powered by Qwen 2.5</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export function LandingPage() {
  const [hovered, setHovered] = useState<PathKey | null>(null);

  return (
    <div className="lp-root-v2">
      <AmbientBackground />
      <Header />
      <main className="lp-main-v2">
        <Hero />
        
        <section className="lp-paths-section">
          <div className="lp-cards-grid">
            {PATHS.map((config) => (
              <PathCard
                key={config.key}
                config={config}
                isDimmed={hovered !== null && hovered !== config.key}
                isHovered={hovered === config.key}
                onHoverStart={() => setHovered(config.key)}
                onHoverEnd={() => setHovered(null)}
              />
            ))}
            
            <div className="lp-badge-or" aria-hidden="true">
              <div className="lp-badge-or-inner">OR</div>
            </div>
          </div>

          <p className="lp-paths-footer">
            <Sparkles aria-hidden="true" />
            Select a discipline
          </p>
        </section>
        
        <AiAssistantPromo />
      </main>
    </div>
  );
}

