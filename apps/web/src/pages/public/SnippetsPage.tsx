import { useState } from "react";
import { Link } from "react-router-dom";
import { snippets } from "../../content/snippets";

export function SnippetsPage() {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  async function copySnippet(slug: string, code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSlug(slug);

      window.setTimeout(() => {
        setCopiedSlug((currentSlug) =>
          currentSlug === slug ? null : currentSlug,
        );
      }, 1800);
    } catch {
      setCopiedSlug(null);
    }
  }

  return (
    <section className="content-page snippets-page">
      <header className="content-page-header">
        <p>CODE LIBRARY</p>

        <h1>
          REUSABLE
          <span>SNIPPETS.</span>
        </h1>

        <p>
          Các hook, helper, middleware và UI component có thể sao chép để sử
          dụng trong dự án.
        </p>
      </header>

      <div className="content-grid content-grid--snippets">
        {snippets.map((snippet) => {
          const isCopied = copiedSlug === snippet.slug;

          return (
            <article
              className="content-card snippet-library-card"
              key={snippet.slug}
            >
              <div className="snippet-card-header">
                <span>{snippet.language}</span>

                <button
                  type="button"
                  className="snippet-copy-button"
                  onClick={() => copySnippet(snippet.slug, snippet.code)}
                  aria-label={`Sao chép ${snippet.title}`}
                >
                  {isCopied ? "ĐÃ CHÉP ✓" : "COPY"}
                </button>
              </div>

              <h2>
                <Link to={`/snippets/${snippet.slug}`}>
                  {snippet.title}
                  <span aria-hidden="true">↗</span>
                </Link>
              </h2>

              <p>{snippet.description}</p>

              <pre aria-label={`Code preview: ${snippet.title}`}>
                <code>{snippet.code}</code>
              </pre>
            </article>
          );
        })}
      </div>
    </section>
  );
}