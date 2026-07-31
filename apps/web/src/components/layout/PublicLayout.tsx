import { Outlet } from "react-router-dom";
import { PublicHeader } from "./PublicHeader";

export function PublicLayout() {
  return (
    <div className="public-site">
      <PublicHeader />
      <Outlet />
    </div>
  );
}