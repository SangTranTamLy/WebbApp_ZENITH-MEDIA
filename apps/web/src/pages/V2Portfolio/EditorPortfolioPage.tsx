import { HeroEditor } from "../../features/portfolio/components/Editor/HeroEditor";
import { AboutEditor } from "../../features/portfolio/components/Editor/AboutEditor";
import { PluginsEditor } from "../../features/portfolio/components/Editor/PluginsEditor";
import { WorksEditor } from "../../features/portfolio/components/Editor/WorksEditor";
import { ContactEditor } from "../../features/portfolio/components/Editor/ContactEditor";
import { useEffect } from "react";

export function EditorPortfolioPage() {
  useEffect(() => {
    document.title = "EDITOR | Zenith Portfolio";
  }, []);

  return (
    <main className="portfolio-page portfolio-page--editor">
      <HeroEditor />
      <AboutEditor />
      <PluginsEditor />
      <WorksEditor />
      <ContactEditor />
    </main>
  );
}
