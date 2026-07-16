import { HeroSection } from "@/components/home/hero-section";
import { WinnersSection } from "@/components/home/winners-section";
import { FeaturedArtSection } from "@/components/home/featured-art-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { CTASection } from "@/components/home/cta-section";
import {
  SponsorsSection,
  CoffeeFactsSection,
  ArticlesSection,
  FAQSection,
} from "@/components/home/more-sections";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SponsorsSection />
      <WinnersSection />
      <FeaturedArtSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CoffeeFactsSection />
      <ArticlesSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
