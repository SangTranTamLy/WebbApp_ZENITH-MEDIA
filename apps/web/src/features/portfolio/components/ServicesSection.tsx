import { motion } from "framer-motion";

const services = [
  {
    number: "01",
    title: "Lập trình",
    description:
      "Giao diện sản phẩm tương thích đa thiết bị và nền tảng phát triển toàn diện, thực tiễn.",
  },
  {
    number: "02",
    title: "Biên tập",
    description:
      "Kể chuyện theo nhịp điệu dành cho quảng cáo, phim và nội dung mạng xã hội.",
  },
  {
    number: "03",
    title: "Chuyển động",
    description:
      "Hệ thống đồ họa, thiết kế tiêu đề và chuyển động chính xác theo từng khung hình.",
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="services-section">
      <motion.span
        className="services-label"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.6 }}
      >
        03 / CHUYÊN MÔN
      </motion.span>

      <motion.div
        className="services-grid"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.12,
            },
          },
        }}
      >
        {services.map((service) => (
          <motion.article
            key={service.number}
            variants={{
              hidden: {
                opacity: 0,
              },
              visible: {
                opacity: 1,
              },
            }}
            transition={{ duration: 0.6 }}
          >
            <b>{service.number}</b>

            <h3 className="service-word-shift">
              {service.title}
            </h3>

            <p>{service.description}</p>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}