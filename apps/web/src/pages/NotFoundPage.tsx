import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <p>404</p>
      <h1>Không tìm thấy trang</h1>
      <Link to="/">Quay lại trang chủ</Link>
    </main>
  );
}