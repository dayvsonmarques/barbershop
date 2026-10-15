// src/app/page.tsx
export const dynamic = "force-dynamic";

import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { ServicesSection } from "@/components/services-section";
import { AboutSection } from "@/components/about-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { InstagramFeed } from "@/components/instagram-feed";
import { ProductsCarousel } from "@/components/products-carousel";
import { MapSection } from "@/components/map-section";
import { BookingCTA } from "@/components/booking-cta";
import { TeamSection } from "@/components/team-section";
import { CoursesSection } from "@/components/courses-section";
import { Footer } from "@/components/footer";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { JsonLd } from "@/components/json-ld";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteSettings, getSiteUrl } from "@/lib/site";
import { formatOpeningHours, toOpeningHoursSpecification } from "@/lib/opening-hours";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

async function getBusinessJsonLd() {
  const [settings, services] = await Promise.all([
    getSiteSettings(),
    prisma.service
      .findMany({ where: { isActive: true }, select: { name: true, description: true, price: true }, orderBy: { id: "asc" } })
      .catch(() => []),
  ]);
  if (!settings) return null;
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BarberShop",
    "@id": `${siteUrl}/#barbershop`,
    name: settings.name,
    url: siteUrl,
    image: `${siteUrl}/barbershop.png`,
    logo: `${siteUrl}/barbershop-logo.png`,
    ...(settings.phone && { telephone: settings.phone }),
    ...(settings.email && { email: settings.email }),
    ...(settings.address && {
      address: { "@type": "PostalAddress", streetAddress: settings.address, addressCountry: "BR" },
    }),
    ...(settings.hasCoords && {
      geo: { "@type": "GeoCoordinates", latitude: settings.latitude, longitude: settings.longitude },
      hasMap: `https://www.google.com/maps?q=${settings.latitude},${settings.longitude}`,
    }),
    ...(settings.openingHours && {
      description: `Horário de funcionamento: ${formatOpeningHours(settings.openingHours)}`,
      openingHoursSpecification: toOpeningHoursSpecification(settings.openingHours),
    }),
    ...(settings.instagramUrl && { sameAs: [settings.instagramUrl] }),
    potentialAction: {
      "@type": "ReserveAction",
      target: `${siteUrl}/agendar`,
      name: "Agendar horário",
    },
    ...(services.length > 0 && {
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Serviços",
        itemListElement: services.map((s) => ({
          "@type": "Offer",
          price: Number(s.price).toFixed(2),
          priceCurrency: "BRL",
          itemOffered: { "@type": "Service", name: s.name, ...(s.description && { description: s.description }) },
        })),
      },
    }),
  };
}

export default async function Home() {
  const businessJsonLd = await getBusinessJsonLd();

  return (
    <main>
      {businessJsonLd && <JsonLd data={businessJsonLd} />}
      <Navbar />
      <HeroSection />
      <ScrollReveal>
        <AboutSection />
      </ScrollReveal>
      <ScrollReveal>
        <ServicesSection />
      </ScrollReveal>
      <ScrollReveal><ProductsCarousel /></ScrollReveal>
      <ScrollReveal>
        <BookingCTA />
      </ScrollReveal>
      {/* <ScrollReveal>
        <InstagramFeed />
      </ScrollReveal> */}
      <ScrollReveal>
        <TeamSection />
      </ScrollReveal>
      <ScrollReveal>
        <CoursesSection />
      </ScrollReveal>
      <MapSection />
      <ScrollReveal>
        <TestimonialsSection />
      </ScrollReveal>
      <Footer />
    </main>
  );
}
