import { HeroCode } from "../../features/portfolio/components/Code/HeroCode";
import { AboutCode } from "../../features/portfolio/components/Code/AboutCode";
import { ProjectsCode } from "../../features/portfolio/components/Code/ProjectsCode";
import { ContactCode } from "../../features/portfolio/components/Code/ContactCode";
import { useEffect } from "react";

export function CodePortfolioPage() {
  useEffect(() => {
    document.title = "CODE | Zenith Portfolio";
  }, []);

  return (
    <main className="portfolio-page portfolio-page--code">
      <HeroCode />
      <AboutCode />
      <ProjectsCode />
      <ContactCode />
    </main>
  );
}
