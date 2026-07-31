import { AboutSection } from "../../features/portfolio/components/AboutSection";
import { ContactSection } from "../../features/portfolio/components/ContactSection";
import { HeroSection } from "../../features/portfolio/components/HeroSection";
import { KnowledgeSection } from "../../features/portfolio/components/KnowledgeSection";
import { ServicesSection } from "../../features/portfolio/components/ServicesSection";

export function HomePage() {
  return (
    <main className="portfolio-page">
      <HeroSection />
      <AboutSection />
      <KnowledgeSection />
      <ServicesSection />
      <ContactSection />
    </main>
  );
}