import { motion } from "framer-motion";

const tools = [
  "Adobe After Effects 2026",
  "Adobe Premiere Pro",
  "Adobe Photoshop",
  "Motion Design",
  "SFX Mixing"
];

export function AboutEditor() {
  return (
    <section className="about-section" id="about">
      <div className="about-profile">
        <motion.div
          className="about-visual"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="profile-orbit orbit-red">
            <span aria-hidden="true" />
            <motion.img
              src="https://avatars.githubusercontent.com/u/182103420?v=4"
              alt="T.Sang — AMV Editor"
              whileHover={{ rotateX: 20, rotateY: 20, scale: 1.2, z: 60 }}
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
          <p className="section-label label-red">01 / VỀ BẢN THÂN</p>

          <h2 className="about-title">
            T.SANG
            <br />
            <em className="text-red">AMV EDITOR.</em>
          </h2>

          <p>
            Với niềm đam mê mãnh liệt dành cho Anime và nghệ thuật thị giác, tôi đã dành nhiều năm để rèn luyện kỹ năng dựng phim và Motion Graphics.
          </p>
          <p>
            Phong cách của tôi thiên về Cinematic, chuyển động nhanh mượt mà (high-energy sync) và sự kết hợp cảm xúc tinh tế giữa SFX và âm nhạc.
          </p>

          <div className="skill-cloud-3d" aria-label="Phần mềm và Kỹ năng">
            {tools.map((tool) => (
              <motion.div 
                key={tool}
                className="tech-icon-3d icon-red"
                whileHover={{ rotateX: 25, rotateY: -25, scale: 1.2, z: 40 }}
                transition={{ type: "spring", stiffness: 300 }}
                style={{ transformStyle: "preserve-3d", perspective: 800 }}
              >
                <span>{tool}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
