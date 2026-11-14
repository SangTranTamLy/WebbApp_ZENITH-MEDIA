import { useEffect, useRef, useState } from "react";

// Keep off-screen catalog art from competing with the selected hero image.
// Native loading="lazy" alone may fetch several screens of product covers.
export function LazyImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [nearby, setNearby] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNearby(true);
        observer.disconnect();
      },
      { rootMargin: "240px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <img ref={ref} src={nearby ? src : undefined} alt={alt} decoding="async" />
  );
}

export function Preview({
  url,
  poster,
  auto = false,
  playOnMount = false,
  label,
}: {
  url?: string;
  poster: string;
  auto?: boolean;
  playOnMount?: boolean;
  label: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video || !auto) return;
    video.removeAttribute("src");
    delete video.dataset.ready;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      if (visible && !reduced.matches && !document.hidden) {
        if (url && !video.getAttribute("src")) video.src = url;
        void video.play().catch(() => {});
      } else {
        video.pause();
        if (reduced.matches) delete video.dataset.ready;
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.4 },
    );
    observer.observe(video);
    const onVisibility = sync;
    const onMotion = sync;
    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", onMotion);
    return () => {
      observer.disconnect();
      video.pause();
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onMotion);
    };
  }, [auto, url]);
  if (url && auto)
    return (
      <span className="preview-media">
        {poster && <LazyImage src={poster} alt={label} />}
        <video
          ref={ref}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          onPlaying={(e) => {
            e.currentTarget.dataset.ready = "true";
          }}
        />
      </span>
    );
  return url ? (
    <video
      ref={ref}
      src={url}
      poster={poster}
      muted={auto}
      loop={auto}
      playsInline
      preload={auto ? "none" : "metadata"}
      controls={!auto}
      autoPlay={playOnMount}
      aria-label={label}
    />
  ) : poster ? (
    <LazyImage src={poster} alt={label} />
  ) : (
    <div className="media-placeholder" aria-label={label} />
  );
}
