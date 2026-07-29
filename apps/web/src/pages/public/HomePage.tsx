
import { PublicHeader } from "../../components/layout/PublicHeader";
import { HeroSection } from "../../features/portfolio/components/HeroSection";
import { AboutSection } from "../../features/portfolio/components/AboutSection";
import { FeaturedProjectsSection } from "../../features/portfolio/components/FeaturedProjectsSection";

export function HomePage() {

  return (
    <main className="portfolio-page">
    <PublicHeader />
    <HeroSection />
    <AboutSection />
    <FeaturedProjectsSection /> 
  </main>
  );
}