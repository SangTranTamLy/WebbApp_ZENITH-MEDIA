import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Loading } from "./components/Primitives";
import { Home, Shop } from "./pages/Storefront";
import { AuthCallback, AuthPage, RequireAuth, Account } from "./pages/Auth";
const Product = lazy(() =>
  import("./pages/Product").then((m) => ({ default: m.ProductPage })),
);
const Checkout = lazy(() =>
  import("./pages/Checkout").then((m) => ({ default: m.Checkout })),
);
const Orders = lazy(() =>
  import("./pages/Orders").then((m) => ({ default: m.Orders })),
);
const OrderDetail = lazy(() =>
  import("./pages/Orders").then((m) => ({ default: m.OrderDetail })),
);
const Library = lazy(() =>
  import("./pages/Library").then((m) => ({ default: m.Library })),
);
const Downloads = lazy(() =>
  import("./pages/Library").then((m) => ({ default: m.DownloadHistory })),
);
const Wishlist = lazy(() =>
  import("./pages/Library").then((m) => ({ default: m.Wishlist })),
);
const Support = lazy(() =>
  import("./pages/Support").then((m) => ({ default: m.Support })),
);
const NewTicket = lazy(() =>
  import("./pages/Support").then((m) => ({ default: m.NewTicket })),
);
const TicketDetail = lazy(() =>
  import("./pages/Support").then((m) => ({ default: m.TicketDetail })),
);
const Notifications = lazy(() =>
  import("./pages/Notifications").then((m) => ({ default: m.Notifications })),
);
const Information = lazy(() =>
  import("./pages/Information").then((m) => ({ default: m.Information })),
);
const NotFound = lazy(() =>
  import("./pages/Information").then((m) => ({ default: m.NotFound })),
);
const Admin = lazy(() => import("./admin/Admin"));

export function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="products/:slug" element={<Product />} />
          <Route path="login" element={<AuthPage />} />
          <Route path="auth/callback" element={<AuthCallback />} />
          <Route
            path="checkout"
            element={
              <RequireAuth>
                <Checkout />
              </RequireAuth>
            }
          />
          <Route
            path="library"
            element={
              <RequireAuth>
                <Library />
              </RequireAuth>
            }
          />
          <Route
            path="orders"
            element={
              <RequireAuth>
                <Orders />
              </RequireAuth>
            }
          />
          <Route
            path="orders/:id"
            element={
              <RequireAuth>
                <OrderDetail />
              </RequireAuth>
            }
          />
          <Route
            path="downloads"
            element={
              <RequireAuth>
                <Downloads />
              </RequireAuth>
            }
          />
          <Route
            path="wishlist"
            element={
              <RequireAuth>
                <Wishlist />
              </RequireAuth>
            }
          />
          <Route
            path="notifications"
            element={
              <RequireAuth>
                <Notifications />
              </RequireAuth>
            }
          />
          <Route
            path="account"
            element={
              <RequireAuth>
                <Account />
              </RequireAuth>
            }
          />
          <Route
            path="account/reset"
            element={
              <RequireAuth>
                <Account />
              </RequireAuth>
            }
          />
          <Route
            path="support"
            element={
              <RequireAuth>
                <Support />
              </RequireAuth>
            }
          />
          <Route
            path="support/new"
            element={
              <RequireAuth>
                <NewTicket />
              </RequireAuth>
            }
          />
          <Route
            path="support/:id"
            element={
              <RequireAuth>
                <TicketDetail />
              </RequireAuth>
            }
          />
          <Route path="faq" element={<Information page="faq" />} />
          <Route path="license" element={<Information page="license" />} />
          <Route path="refund" element={<Information page="refund" />} />
          <Route
            path="admin/:section?/:id?"
            element={
              <RequireAuth admin>
                <Admin />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
