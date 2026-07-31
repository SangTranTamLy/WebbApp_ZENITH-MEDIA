import { Link } from "react-router-dom";
import { posts } from "../../content/posts";

export function BlogPage() {
  return (
    <section className="content-page blog-page">
      <header className="content-page-header">
        <p>TECH BLOG / DEVELOPMENT NOTES</p>

        <h1>
          BUILDING IN
          <span>PUBLIC.</span>
        </h1>

        <p>
          Ghi lại quá trình phát triển sản phẩm, quyết định kỹ thuật và những
          bài học thực tế từ các dự án của tôi.
        </p>
      </header>

      <div className="content-grid content-grid--blog">
        {posts.map((post) => (
          <article className="content-card" key={post.slug}>
            <Link
              to={`/blog/${post.slug}`}
              aria-label={`Đọc bài viết ${post.title}`}
            >
              <div className="content-card-meta">
                <span>{post.category}</span>
                <span>{post.publishedAt}</span>
                <span>{post.readingTime}</span>
              </div>

              <h2>{post.title}</h2>

              <p>{post.excerpt}</p>

              <ul aria-label="Công nghệ sử dụng">
                {post.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>

              <footer>
                <span>ĐỌC BÀI VIẾT</span>
                <b aria-hidden="true">↗</b>
              </footer>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}