import { Fragment} from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getPostBySlug } from "../../content/posts";
import { CodeBlock } from "../../components/ui/CodeBlock";
export function BlogPostPage() {
  const { slug } = useParams();


  const post = slug ? getPostBySlug(slug) : undefined;

  if (!post) {
    return <Navigate to="/blog" replace />;
  }


  return (
    <section className="content-page article-page">
      <article>
        <Link className="article-back-link" to="/blog">
          <span aria-hidden="true">←</span>
          BACK TO BLOG
        </Link>

        <header className="article-header">
          <p>{post.category}</p>

          <h1>{post.title}</h1>

          <p>{post.excerpt}</p>

          <div className="article-information">
            <span>{post.publishedAt}</span>
            <span>{post.readingTime}</span>
          </div>

          <ul aria-label="Công nghệ và chủ đề">
            {post.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </header>

        <div className="article-content">
          {post.content.map((section, sectionIndex) => (
            <Fragment key={`${post.slug}-${sectionIndex}`}>
              {section.heading && <h2>{section.heading}</h2>}

              {section.paragraphs.map(
                (paragraph, paragraphIndex) => (
                  <p
                    key={`${post.slug}-${sectionIndex}-${paragraphIndex}`}
                  >
                    {paragraph}
                  </p>
                ),
              )}

              {section.code && (
                <CodeBlock
                  code={section.code}
                  language={section.language}
                  showLineNumbers
                />
              )}
            </Fragment>
          ))}
        </div>
      </article>
    </section>
  );
}