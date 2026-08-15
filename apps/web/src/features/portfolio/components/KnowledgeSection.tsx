import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { snippets } from "../../../content/contentIndex";

export function KnowledgeSection() {
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  async function copySnippet(slug: string, code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSnippet(slug);

      window.setTimeout(() => {
        setCopiedSnippet((currentSnippet) =>
          currentSnippet === slug ? null : currentSnippet,
        );
      }, 1800);
    } catch {
      setCopiedSnippet(null);
    }
  }

  return (
    <section id="knowledge" className="knowledge-section">
      <motion.div
        className="knowledge-heading"
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.7 }}
      >
        <p className="knowledge-label">
          02 / KIẾN THỨC & MÃ NGUỒN
        </p>

        <h2>
          <span>TÔI KHÔNG CHỈ XÂY DỰNG.</span>
          <em>TÔI CHIA SẺ CÁCH NÓ HOẠT ĐỘNG.</em>
        </h2>

        <p className="knowledge-introduction">
          Ghi lại quá trình xây dựng sản phẩm, những quyết định kỹ thuật và các
          đoạn code có thể tái sử dụng trong những dự án thực tế.
        </p>
      </motion.div>

      <div className="snippets-heading">
        <div>
          <span>CODE SNIPPETS</span>
          <p>Các đoạn code nhỏ có thể sao chép và sử dụng ngay.</p>
        </div>

        <Link to="/snippets">
          Mở thư viện Snippets
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="snippets-grid">
        {snippets.map((snippet, index) => (
          <motion.article
            className="snippet-card"
            key={snippet.slug}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{
              duration: 0.6,
              delay: index * 0.08,
            }}
          >
            <div className="snippet-card-header">
              <div>
                <span>{snippet.language}</span>
                <h3>{snippet.title}</h3>
              </div>

              <button
                type="button"
                onClick={() => copySnippet(snippet.slug, snippet.code)}
                aria-label={`Sao chép đoạn code ${snippet.title}`}
              >
                {copiedSnippet === snippet.slug ? "ĐÃ COPY" : "COPY"}
              </button>
            </div>

            <p>{snippet.description}</p>

            <pre>
              <code>{snippet.code}</code>
            </pre>

            <Link to={`/snippets/${snippet.slug}`}>
              Xem chi tiết
              <span aria-hidden="true">→</span>
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
