import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const workflowSteps = [
  "Khám phá",
  "Đặt dự án",
  "Tải lên",
  "Duyệt",
  "Phê duyệt",
  "Bàn giao",
];

const platformFeatures = [
  {
    number: "01",
    title: "Đặt dự án & báo giá",
    description:
      "Thu thập phạm vi, tài liệu tham khảo, ngân sách và thời hạn; sau đó trình bày báo giá minh bạch trước khi bắt đầu.",
  },
  {
    number: "02",
    title: "Không gian khách hàng bảo mật",
    description:
      "Mỗi dự án có không gian riêng với quyền truy cập theo vai trò dành cho khách hàng, quản trị viên và cộng tác viên.",
  },
  {
    number: "03",
    title: "Quản lý tài nguyên đám mây",
    description:
      "Tải trực tiếp tệp nguồn dung lượng lớn lên kho lưu trữ đối tượng mà không gây quá tải máy chủ ứng dụng.",
  },
  {
    number: "04",
    title: "Duyệt theo mốc thời gian",
    description:
      "Bình luận chính xác tại từng khung hình, xử lý phản hồi và bảo đảm trao đổi luôn gắn đúng phiên bản.",
  },
  {
    number: "05",
    title: "Quản lý phiên bản",
    description:
      "Sắp xếp rõ Bản nháp v1, Bản nháp v2 và Bản hoàn chỉnh để tránh phê duyệt hoặc bàn giao nhầm bản dựng.",
  },
  {
    number: "06",
    title: "Thanh toán & bàn giao",
    description:
      "Theo dõi tiền cọc, số dư và tự động mở khóa tệp master không watermark sau khi xác nhận thanh toán.",
  },
];

const technologyGroups = [
  {
    label: "GIAO DIỆN",
    technologies: "React · TypeScript",
  },
  {
    label: "MÁY CHỦ",
    technologies: "Node.js · Express · OpenAPI",
  },
  {
    label: "DỮ LIỆU & TÁC VỤ",
    technologies: "PostgreSQL · Prisma · Redis · BullMQ",
  },
  {
    label: "TRUYỀN THÔNG & GIÁM SÁT",
    technologies: "S3 · CloudFront · Sentry · OpenTelemetry",
  },
];

export function PlatformSection() {
  return (
    <section id="platform" className="platform-section">
      <motion.div
        className="platform-intro"
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.75 }}
      >
        <p className="platform-label">03 / ZENITH WORKSPACE</p>

        <h2 className="platform-title">
          <span>TỪ BẢN YÊU CẦU</span>
          <span>ĐẦU TIÊN</span>
          <em>ĐẾN KHUNG HÌNH CUỐI.</em>
        </h2>

        <p className="platform-description">
          Zenith Workspace kết hợp hồ sơ năng lực công khai với nền tảng Quản
          lý Tài nguyên Truyền thông riêng tư. Toàn bộ quy trình sản xuất video
          được kết nối liền mạch—từ tiếp nhận yêu cầu, tải tệp nguồn đến duyệt
          bản dựng, thanh toán và bàn giao.
        </p>

        <div className="platform-actions">
          <a className="platform-primary" href="#contact">
            Gửi yêu cầu dự án
            <span aria-hidden="true">↗</span>
          </a>

          <Link className="platform-secondary" to="/login">
            Khám phá không gian khách hàng
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </motion.div>

      <motion.div
        className="workflow-strip"
        aria-label="Quy trình Zenith Workspace"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.08,
            },
          },
        }}
      >
        {workflowSteps.map((step, index) => (
          <motion.span
            key={step}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 },
            }}
            transition={{ duration: 0.45 }}
          >
            <i>{String(index + 1).padStart(2, "0")}</i>
            <b>{step}</b>
          </motion.span>
        ))}
      </motion.div>

      <div className="platform-feature-grid">
        {platformFeatures.map((feature, index) => (
          <motion.article
            key={feature.number}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.6,
              delay: (index % 3) * 0.1,
            }}
          >
            <i>{feature.number}</i>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
            <span>MÔ-ĐUN ZENITH</span>
          </motion.article>
        ))}
      </div>

      <motion.div
        className="stack-panel"
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.7 }}
      >
        <div className="stack-introduction">
          <span>CÔNG NGHỆ SẢN XUẤT DỰ KIẾN</span>

          <h3>
            Khởi đầu tinh gọn.
            <br />
            Sẵn sàng mở rộng có kiểm soát.
          </h3>
        </div>

        <div className="stack-groups">
          {technologyGroups.map((group) => (
            <p key={group.label}>
              <b>{group.label}</b>
              <span>{group.technologies}</span>
            </p>
          ))}
        </div>
      </motion.div>
    </section>
  );
}