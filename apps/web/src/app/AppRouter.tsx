import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PublicLayout } from "../components/layout/PublicLayout";
import { NotFoundPage } from "../pages/NotFoundPage";
import { BlogPage } from "../pages/public/BlogPage";
import { BlogPostPage } from "../pages/public/BlogPostPage";
import { HomePage } from "../pages/public/HomePage";
import { SnippetDetailPage } from "../pages/public/SnippetDetailPage";
import { SnippetsPage } from "../pages/public/SnippetsPage";

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/blog",
        element: <BlogPage />,
      },
      {
        path: "/blog/:slug",
        element: <BlogPostPage />,
      },
      {
        path: "/snippets",
        element: <SnippetsPage />,
      },
      {
        path: "/snippets/:slug",
        element: <SnippetDetailPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}