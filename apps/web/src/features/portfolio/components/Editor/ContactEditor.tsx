import { motion } from "framer-motion";

export function ContactEditor() {
  return (
    <section className="contact-section" id="contact">
      <motion.div
        className="contact-card contact-card--red"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        whileHover={{ rotateX: 5, rotateY: 5, scale: 1.02 }}
        style={{ transformStyle: "preserve-3d", perspective: 1000 }}
      >
        <div className="contact-header">
          <h2>
            SẴN SÀNG
            <br />
            <em className="text-red">CỘNG TÁC.</em>
          </h2>

          <p>
            Bạn cần một AMV Editor cho dự án sắp tới hoặc muốn hợp tác làm nội dung TikTok?
            Hãy liên hệ với tôi qua email hoặc các nền tảng mạng xã hội.
          </p>

          <a
            className="contact-email email-red"
            href="mailto:sangchaubr089@gmail.com?subject=AMV%20Editor%20Contact"
          >
            sangchaubr089@gmail.com
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="contact-footer">
          <span>© 2026 T.Sang</span>
          <div className="footer-links">
            <a href="https://www.tiktok.com/@zenithedi_" target="_blank" rel="noreferrer">
              TikTok (Zenith)
            </a>
            <a href="https://www.tiktok.com/@fairytail100yq_mvs" target="_blank" rel="noreferrer">
              TikTok (Fairy Tail)
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
