import { motion } from "framer-motion";

import { Layers } from "lucide-react";
import { TrackingCard3D } from "../../../../components/ui/TrackingCard3D";

const plugins = [
  {
    name: "BCC (Boris FX)",
    description: "Bộ VFX và transitions chuyên nghiệp mang lại hiệu ứng ánh sáng và biến dạng đẹp mắt.",
    icon: (
      <svg width="42" height="42" viewBox="0 0 100 100" className="plugin-icon-svg" style={{ filter: "drop-shadow(0 0 8px rgba(2, 132, 199, 0.4))" }}>
        <polygon points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25" fill="#000000" />
        <polygon points="50,3 90.7,26.5 90.7,73.5 50,97 9.3,73.5 9.3,26.5" fill="#ffffff" />
        <polygon points="50,7 87,28.5 50,50 13,28.5" fill="#14a4de" />
        <polygon points="50,50 13,28.5 13,71.5 50,93" fill="#15658e" />
        <polygon points="50,50 87,28.5 87,71.5 50,93" fill="#0d4868" />
        <text x="50" y="69" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="56" fill="#ffffff" textAnchor="middle" letterSpacing="-2">C</text>
      </svg>
    )
  },
  {
    name: "Flowframes",
    description: "Phần mềm sử dụng AI để nội suy khung hình (Video Interpolation), giúp nâng frame rate video mượt mà lên 60fps/120fps.",
    icon: (
      <svg width="42" height="42" viewBox="0 0 100 100" className="plugin-icon-svg" style={{ filter: "drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))" }}>
        <defs>
          <linearGradient id="ffGradTL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#0077b6" />
          </linearGradient>
          <linearGradient id="ffGradBR" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#00e676" />
            <stop offset="100%" stopColor="#00b4d8" />
          </linearGradient>
        </defs>
        <polygon points="0,0 96,0 76,20 20,20 20,35 61,35 46,50 20,50 20,76 0,96" fill="url(#ffGradTL)" />
        <polygon points="100,100 4,100 24,80 80,80 80,65 39,65 54,50 80,50 80,24 100,4" fill="url(#ffGradBR)" />
      </svg>
    )
  },
  {
    name: "Layer Fast",
    description: "Tối ưu hóa quản lý và sắp xếp layer trong những project phức tạp có hàng nghìn cut.",
    icon: <Layers size={42} strokeWidth={1.5} className="plugin-icon-svg" />
  },
  {
    name: "Kuronai / Method",
    description: "Workflow render chuẩn 1080p 60fps, đảm bảo video cực sắc nét khi up lên TikTok/YouTube.",
    icon: (
      <div className="kuronai-logo">
        <span className="kuronai-k">K</span>
      </div>
    )
  }
];

export function PluginsEditor() {
  return (
    <section className="plugins-section" id="plugins">
      <motion.div
        className="github-heading"
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <span className="label-red">02 / CÔNG NGHỆ SỬ DỤNG</span>
        <p>Các plugin và workflow độc quyền giúp tạo nên sự khác biệt trong từng khung hình.</p>
      </motion.div>

      <div className="plugins-grid-3d">
        {plugins.map((plugin, i) => (
          <TrackingCard3D
            key={plugin.name}
            className="plugin-card-3d"
            delay={i * 0.1}
          >
            <div className="plugin-card-inner">
              <div className="plugin-icon-wrapper">
                {plugin.icon}
              </div>
              <h3>{plugin.name}</h3>
              <p>{plugin.description}</p>
            </div>
            <div className="plugin-card-glow" />
          </TrackingCard3D>
        ))}
      </div>
    </section>
  );
}
