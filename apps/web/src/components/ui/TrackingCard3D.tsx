import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { useRef, useState, type MouseEvent, type ReactNode, type CSSProperties } from "react";

interface TrackingCard3DProps {
  children: ReactNode;
  className?: string;
  tiltAmount?: number;
  delay?: number;
  href?: string;
  target?: string;
  rel?: string;
  style?: CSSProperties;
}

export function TrackingCard3D({ children, className = "", tiltAmount = 18, delay = 0, href, target, rel, style }: TrackingCard3DProps) {
  const reduceMotion = useReducedMotion();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardRef = useRef<any>(null);
  const [isHovering, setIsHovering] = useState(false);
  
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);

  const springConfig = { stiffness: 400, damping: 30, mass: 0.8 };
  
  // Rotations for the 3D tilt
  const rotateX = useSpring(useTransform(pointerY, [0, 1], [tiltAmount, -tiltAmount]), springConfig);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-tiltAmount, tiltAmount]), springConfig);
  
  // Parallax for the glare spotlight
  const glareX = useSpring(useTransform(pointerX, [0, 1], [100, 0]), springConfig);
  const glareY = useSpring(useTransform(pointerY, [0, 1], [100, 0]), springConfig);
  
  // Shadow moves opposite to mouse
  const shadowX = useSpring(useTransform(pointerX, [0, 1], [-20, 20]), springConfig);
  const shadowY = useSpring(useTransform(pointerY, [0, 1], [-20, 20]), springConfig);

  function handlePointerMove(e: MouseEvent<HTMLDivElement | HTMLAnchorElement>) {
    if (reduceMotion) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Normalized 0 to 1
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    pointerX.set(x);
    pointerY.set(y);
  }

  function handlePointerEnter() {
    setIsHovering(true);
  }

  function handlePointerLeave() {
    setIsHovering(false);
    if (reduceMotion) return;
    pointerX.set(0.5);
    pointerY.set(0.5);
  }

  const MotionComponent = href ? motion.a : motion.div;

  return (
    <MotionComponent
      ref={cardRef}
      href={href}
      target={target}
      rel={rel}
      className={`${className} group relative overflow-visible`}
      onMouseMove={handlePointerMove}
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      style={{
        ...style,
        rotateX: reduceMotion || !isHovering ? 0 : rotateX,
        rotateY: reduceMotion || !isHovering ? 0 : rotateY,
        transformStyle: "preserve-3d",
        perspective: 1200,
      }}
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: 1.03 }}
    >
      {/* Static Content (No Parallax) */}
      <div className="w-full h-full relative z-10">
        {children}
      </div>

      {/* Dynamic Glare Spotlight */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-50 rounded-[inherit] opacity-0 mix-blend-overlay transition-opacity duration-300"
        style={{
          opacity: isHovering ? 0.6 : 0,
          background: useTransform(
            [glareX, glareY],
            ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.4) 0%, transparent 60%)`
          )
        }}
      />
      
      {/* Dynamic Colored Glow / Shadow */}
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 blur-2xl"
        style={{
          opacity: isHovering ? 0.4 : 0,
          x: shadowX,
          y: shadowY,
          background: "linear-gradient(135deg, rgba(239,68,68,0.5), rgba(59,130,246,0.5))"
        }}
      />
    </MotionComponent>
  );
}
