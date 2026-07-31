import { Link, Navigate, useParams } from "react-router-dom";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { getSnippetBySlug } from "../../content/snippets";

export function SnippetDetailPage() {
  const { slug } = useParams();
  const snippet = slug ? getSnippetBySlug(slug) : undefined;

  if (!snippet) {
    return <Navigate to="/snippets" replace />;
  }

  return (
    <section className="content-page snippet-detail-page">
      <article>
        <Link className="article-back-link" to="/snippets">
          <span aria-hidden="true">←</span>
          BACK TO SNIPPETS
        </Link>

        <header>
          <p>{snippet.language.toUpperCase()} / CODE SNIPPET</p>

          <h1>{snippet.title}</h1>

          <span>{snippet.description}</span>
        </header>

        <CodeBlock
          className="snippet-detail-code"
          code={snippet.code}
          language={snippet.language}
          showLineNumbers
        />
      </article>
    </section>
  );
}