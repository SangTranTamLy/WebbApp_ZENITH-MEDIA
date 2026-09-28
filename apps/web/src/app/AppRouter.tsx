import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { PublicLayout } from "../components/layout/PublicLayout";
import { RouteScrollToTop } from "../components/layout/RouteScrollToTop";

import { NotFoundPage } from "../pages/NotFoundPage";
import { LandingPage } from "../pages/LandingPage";
import { CodePortfolioPage } from "../pages/V2Portfolio/CodePortfolioPage";
import { EditorPortfolioPage } from "../pages/V2Portfolio/EditorPortfolioPage";

const router = createBrowserRouter([
  {
    element: <RouteScrollToTop />,
    errorElement: <NotFoundPage />,

    children: [
      /*
       * LANDING
       */
      {
        path: "/",
        element: <LandingPage />,
      },

      /*
       * PORTFOLIOS
       */
      {
        element: <PublicLayout />,

        children: [
          {
            path: "/code",
            element: <CodePortfolioPage />,
          },
          {
            path: "/editor",
            element: <EditorPortfolioPage />,
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
