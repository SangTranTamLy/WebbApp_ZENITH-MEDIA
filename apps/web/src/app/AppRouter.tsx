import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { AuthLayout } from "../components/layout/AuthLayout";
import { PublicLayout } from "../components/layout/PublicLayout";
import { RouteScrollToTop } from "../components/layout/RouteScrollToTop";

import { NotFoundPage } from "../pages/NotFoundPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { HomePage } from "../pages/public/HomePage";
import { SnippetDetailPage } from "../pages/public/SnippetDetailPage";
import { SnippetsPage } from "../pages/public/SnippetsPage";

const router = createBrowserRouter([
  {
    element: <RouteScrollToTop />,
    errorElement: <NotFoundPage />,

    children: [
      /*
       * PUBLIC WEBSITE
       */
      {
        element: <PublicLayout />,

        children: [
          {
            path: "/",
            element: <HomePage />,
          },
          {
            path: "/snippets",
            element: <SnippetsPage />,
          },
          {
            path: "/snippets/:slug",
            element: <SnippetDetailPage />,
          },
        ],
      },

      /*
       * AUTHENTICATION
       */
      {
        element: <AuthLayout />,

        children: [
          {
            path: "/login",
            element: <LoginPage />,
          },
        ],
      },

      /*
       * NOT FOUND
       */
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