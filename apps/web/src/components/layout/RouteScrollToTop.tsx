import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

export function RouteScrollToTop() {
  const { hash, pathname, search } = useLocation();

  useEffect(() => {
    const sectionId = hash.replace(/^#/, "");
    const section = sectionId ? document.getElementById(sectionId) : null;

    if (section) {
      section.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [hash, pathname, search]);

  return <Outlet />;
}
