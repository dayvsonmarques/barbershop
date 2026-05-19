// src/components/testimonials-section.tsx
import { SectionLabel } from "@/components/ui/section-label";

type Testimonial = {
  quote: string;
  author: string;
  rating: number;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "Melhor barbearia de Recife, sem dúvida. O corte durou semanas perfeito.",
    author: "Marcos Oliveira",
    rating: 5,
  },
  {
    quote:
      "Atendimento impecável e resultado acima das expectativas. Voltarei sempre.",
    author: "João Paulo",
    rating: 5,
  },
  {
    quote:
      "A barba ficou exatamente como eu queria. Profissionais de verdade.",
    author: "Lucas Ferreira",
    rating: 5,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-1 mt-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < count ? "#C9A84C" : "none"}
          stroke="#C9A84C"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ quote, author, rating }: Testimonial) {
  return (
    <div className="bg-background-secondary p-8 relative">
      <svg
        className="absolute top-6 left-6 text-gold opacity-25"
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="#C9A84C"
        aria-hidden="true"
      >
        <text x="0" y="44" fontSize="56" fontFamily="Georgia, serif">
          &#8220;
        </text>
      </svg>
      <blockquote className="font-heading italic text-lg text-text-primary pt-8 leading-snug">
        {quote}
      </blockquote>
      <footer className="mt-4">
        <p className="text-text-secondary text-sm">{author}</p>
        <Stars count={rating} />
      </footer>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="bg-background-primary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel label="Depoimentos" />
        <h2
          className="font-heading text-text-primary mb-12"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          O que dizem nossos clientes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <TestimonialCard key={t.author} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}
