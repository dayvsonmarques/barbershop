import { prisma } from "@/lib/prisma";
import { SectionLabel } from "@/components/ui/section-label";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";

export async function TestimonialsSection() {
  const testimonials = await prisma.testimonial.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: { id: true, author: true, quote: true, avatarUrl: true, rating: true },
  });

  return (
    <section id="depoimentos" className="bg-background-primary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel label="Depoimentos" />
        <h2
          className="font-heading text-text-primary mb-12"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          O que dizem nossos clientes
        </h2>
        <TestimonialsCarousel testimonials={testimonials} />
      </div>
    </section>
  );
}
