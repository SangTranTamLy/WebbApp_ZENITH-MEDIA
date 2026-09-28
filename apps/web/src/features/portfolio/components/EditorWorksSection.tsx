import { motion } from "framer-motion";
import amvThumb1 from "../../../assets/amv-thumb-1.png";
import amvThumb2 from "../../../assets/amv-thumb-2.png";
import amvThumb3 from "../../../assets/amv-thumb-3.png";

const works = [
  {
    label: "AMV · TikTok @zenithedi_",
    title: "ZENITH EDIT — Compilation",
    desc: "Bộ sưu tập các bản AMV anime với kỹ thuật sync beat, motion blur và hiệu ứng VFX từ BCC. Phong cách high-energy, cinematic dark.",
    tags: ["AMV", "Sync Edit", "BCC VFX", "1080p 60fps"],
    href: "https://www.tiktok.com/@zenithedi_",
    thumb: amvThumb1,
    featured: true,
  },
  {
    label: "MVS · TikTok @fairytail100yq_mvs",
    title: "FAIRY TAIL — MVS Series",
    desc: "Series MVS (Music Video Slideshow) chủ đề Fairy Tail, kết hợp nhạc epic và cắt ghép cảnh theo cảm xúc với Motion 1080 60fps.",
    tags: ["MVS", "Fairy Tail", "Kuronai", "60fps"],
    href: "https://www.tiktok.com/@fairytail100yq_mvs",
    thumb: amvThumb2,
    featured: false,
  },
  {
    label: "Personal Work",
    title: "SYNC EDIT — Beat Drop",
    desc: "Bản sync edit cắt cảnh chuẩn beat với Flow easing curves, Layer Fast workflow và hiệu ứng ánh sáng từ BCC Lens Flare.",
    tags: ["Sync Edit", "Flow", "Layer Fast", "Beat Drop"],
    href: "https://www.tiktok.com/@zenithedi_",
    thumb: amvThumb3,
    featured: false,
  },
];

export function EditorWorksSection() {
  return (
    <section className="editor-works" id="works">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
      >
        <p className="editor-section-label">03 / Tác Phẩm</p>
        <h2>AMV &amp; Works</h2>
        <p className="editor-works-intro">
          Các bản edit đã xuất bản trên TikTok — từ AMV anime action đến MVS cảm xúc.
          Mỗi bản edit là một câu chuyện được kể bằng hình ảnh và âm thanh.
        </p>
      </motion.div>

      <motion.div
        className="editor-works-grid"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.15 } },
        }}
      >
        {works.map((work) => (
          <motion.div
            key={work.title}
            className={`editor-work-card${work.featured ? " editor-work-card--featured" : ""}`}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
            }}
          >
            <a
              className="editor-work-card-inner"
              href={work.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Xem ${work.title} trên TikTok`}
            >
              <img
                className="editor-work-thumbnail"
                src={work.thumb}
                alt={work.title}
                loading="lazy"
              />
              <div className="editor-work-body">
                <p className="editor-work-label">{work.label}</p>
                <h3 className="editor-work-title">{work.title}</h3>
                <p className="editor-work-desc">{work.desc}</p>
                <div className="editor-work-meta">
                  {work.tags.map((tag) => (
                    <span key={tag} className="editor-work-tag">{tag}</span>
                  ))}
                  <span className="editor-work-link-icon">↗</span>
                </div>
              </div>
            </a>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
