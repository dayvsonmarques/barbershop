// src/app/page.tsx
import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { ServicesSection } from "@/components/services-section";
import { AboutSection } from "@/components/about-section";
import { TeamSection } from "@/components/team-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { InstagramFeed } from "@/components/instagram-feed";
import { ProductsCarousel } from "@/components/products-carousel";
import { MapSection } from "@/components/map-section";
import { BookingCTA } from "@/components/booking-cta";
import { Footer } from "@/components/footer";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <ScrollReveal>
        <ServicesSection />
      </ScrollReveal>
      <ScrollReveal>
        <AboutSection />
      </ScrollReveal>
      <ScrollReveal>
        <TeamSection />
      </ScrollReveal>
      <ScrollReveal>
        <TestimonialsSection />
      </ScrollReveal>
      <ScrollReveal>
        <InstagramFeed />
      </ScrollReveal>
      <ScrollReveal><ProductsCarousel /></ScrollReveal>
      <MapSection />
      <ScrollReveal>
        <BookingCTA />
      </ScrollReveal>
      <Footer />
    </main>
  );
}
