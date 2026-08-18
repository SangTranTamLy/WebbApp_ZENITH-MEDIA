import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { AuthLayout } from "../components/layout/AuthLayout";
import { PublicLayout } from "../components/layout/PublicLayout";
import { RouteScrollToTop } from "../components/layout/RouteScrollToTop";

import { RequireAuth } from "../features/auth/RequireAuth";

import { NotFoundPage } from "../pages/NotFoundPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";
import { VerifyEmailPage } from "../pages/auth/VerifyEmailPage";
import { CommunityPage } from "../pages/community/CommunityPage";
import { CommunityLayout } from "../components/layout/CommunityLayout";
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
          {
            path: "/register",
            element: <RegisterPage />,
          },
          {
            path: "/verify-email",
            element: <VerifyEmailPage />,
          },
          {
            path: "/forgot-password",
            element: <ForgotPasswordPage />,
          },
          {
            path: "/reset-password",
            element: <ResetPasswordPage />,
          },
        ],
      },

      /*
       * PROTECTED COMMUNITY
       */
      {
        element: <RequireAuth />,

        children: [
          {
            element: <CommunityLayout />,

            children: [
              {
                path: "/community",
                element: <CommunityPage />,
              },
            ],
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
