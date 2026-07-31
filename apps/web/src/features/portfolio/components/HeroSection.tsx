export function HeroSection() {
  return (
    <section id="home" className="hero personal-hero">
      <div className="hero-art" aria-hidden="true">
        <b>HỒ SƠ NĂNG LỰC / 2026</b>

        <span>
          THÀNH PHỐ HỒ CHÍ MINH • VIỆT NAM
        </span>

        <div className="hero-beam" />
      </div>

      <div className="hero-copy">
        <p className="hero-kicker">
          — T.SANG / FULL-STACK DEVELOPER & CREATIVE CODER
        </p>

        <h1 className="hero-title">
          <span className="hero-title-line">
            TÔI XÂY DỰNG
          </span>

          <span className="hero-title-line hero-title-line--delayed">
            SẢN PHẨM SỐ

            <em
              className="hero-shimmer"
              data-text="ĐẦY CHUYỂN ĐỘNG."
            >
              CÓ CHIỀU SÂU.
            </em>
          </span>
        </h1>

        <p className="hero-description">
          Tôi xây dựng các sản phẩm web bằng React, TypeScript và Express, đồng thời
          chia sẻ quy trình thiết kế, kiến trúc và những đoạn code có thể tái sử dụng.
        </p>

        <div className="hero-actions">
          <a className="hero-primary" href="#development">
            Xem dự án
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>

      <div className="hero-profile-card">
        <img
          src="https://avatars.githubusercontent.com/u/182103420?v=4"
          alt="Ảnh đại diện của T.Sang"
        />

        <div>
          <small>HỒ SƠ 001</small>
          <b>T.SANG</b>
          <span>Full-stack Developer</span>
        </div>

        <i>SẴN SÀNG</i>
      </div>
    </section>
  );
}