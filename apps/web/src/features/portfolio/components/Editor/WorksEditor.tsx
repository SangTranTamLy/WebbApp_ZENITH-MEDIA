import { motion } from "framer-motion";
import { TrackingCard3D } from "../../../../components/ui/TrackingCard3D";

const amvWorks = [
  {
    title: "Cinematic AMV Series",
    anime: "Various Anime",
    style: "Sync & Flow",
    link: "https://www.tiktok.com/@zenithedi_",
    thumb: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop"
  },
  {
    title: "Fairy Tail 100YQ Edits",
    anime: "Fairy Tail",
    style: "High Energy",
    link: "https://www.tiktok.com/@fairytail100yq_mvs",
    thumb: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=600&auto=format&fit=crop"
  }
];

export function WorksEditor() {
  return (
    <section className="projects-section" id="works">
      <motion.div
        className="github-heading"
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <span className="label-red">03 / DỰ ÁN NỔI BẬT</span>
        <p>Các video AMV và MVS được thiết kế tỉ mỉ, thu hút hàng ngàn lượt xem trên TikTok.</p>
      </motion.div>

      <div className="repo-grid-3d works-grid-3d">
        {amvWorks.map((work, i) => (
          <TrackingCard3D
            href={work.link}
            key={work.title}
            className="work-card-3d"
            target="_blank"
            rel="noreferrer"
            delay={i * 0.15}
            style={{ 
              backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 100%), url(${work.thumb})`
            }}
          >
            <div className="work-card-inner">
              <small className="text-red">{work.anime}</small>
              <h3>{work.title}</h3>
              <p>{work.style}</p>
              <span className="cta-red">
                Xem trên TikTok
                <b aria-hidden="true">↗</b>
              </span>
            </div>
          </TrackingCard3D>
        ))}
      </div>
    </section>
  );
}
