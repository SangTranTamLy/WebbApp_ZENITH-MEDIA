import { motion } from "framer-motion";

export function HeroEditor() {
  return (
    <section id="home" className="hero editor-hero">
      <div className="hero-art" aria-hidden="true">
        <b>AMV & MOTION / 2026</b>
        <span>HO CHI MINH CITY • VIETNAM</span>
        <div className="hero-beam hero-beam--red" />
      </div>

      <div className="hero-copy">
        <p className="hero-kicker">
          — T.SANG / MOTION DESIGNER & AMV EDITOR
        </p>

        <h1 className="hero-title">
          <span className="hero-title-line">
            TÔI KỂ CHUYỆN
          </span>
          <span className="hero-title-line hero-title-line--delayed">
            BẰNG TỪNG
            <em className="hero-shimmer hero-shimmer--red" data-text="KHUNG HÌNH.">
              KHUNG HÌNH.
            </em>
          </span>
        </h1>

        <p className="hero-description">
          Đam mê dựng AMV, Motion Graphics và SFX. Tạo ra các video đầy nhịp điệu, cinematic và sắc nét nhờ sự kết hợp hoàn hảo giữa âm nhạc và chuyển động.
        </p>

        <div className="hero-actions">
          <a className="hero-primary hero-primary--red" href="#works">
            Xem tác phẩm
            <span aria-hidden="true">↓</span>
          </a>
          <a className="hero-secondary" href="https://www.tiktok.com/@zenithedi_" target="_blank" rel="noreferrer">
            TikTok ↗
          </a>
        </div>
      </div>

      <motion.div 
        className="hero-profile-card hover-3d hover-3d--heavy"
        whileHover={{ rotateX: 25, rotateY: -30, scale: 1.1, z: 50 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <div className="card-glare" />
        <img
          src="https://avatars.githubusercontent.com/u/182103420?v=4"
          alt="Ảnh đại diện của T.Sang Editor"
        />
        <div>
          <small>HỒ SƠ EDITOR</small>
          <b>T.SANG</b>
          <span>AMV & SFX Editor</span>
        </div>
        <i className="status-red">ĐANG DỰNG</i>
      </motion.div>
    </section>
  );
}
