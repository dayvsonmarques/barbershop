// src/components/testimonials-section.tsx
import { SectionLabel } from "@/components/ui/section-label";

type Testimonial = {
  quote: string;
  author: string;
  rating: number;
};

const testimonials: Testimonial[] = [
  {
    quote: "Muito agradável, um ótimo ambiente com ótimos profissionais.",
    author: "Ronald Vinicius",
    rating: 5,
  },
  {
    quote: "Profissionais sensacionais, excelente ambiente climatizado, cortes agendados sem necessidade de espera. Recomendo e sou cliente há anos!",
    author: "Vinícius Lopes",
    rating: 5,
  },
  {
    quote: "Atendimento muito bom, os rapazes são muito educados e prestativos. Fazem aquilo que você pede, nada mais nada menos — eles até sugerem caso você peça. Muito bom o resultado do corte de cabelo.",
    author: "Marcos Egito",
    rating: 5,
  },
  {
    quote: "Amei demais o meu corte de cabelo, foi realmente como eu esperava. Aconselho demais vocês fazerem nessa barbearia, todos são um amor de pessoa, top!",
    author: "Adricia Rodrigues",
    rating: 5,
  },
  {
    quote: "Ambiente profissional, bastante organizado com barbeiros impecáveis. Preço acessível e tem até cafezinho. Nota 1000.",
    author: "Mateus Willis",
    rating: 5,
  },
  {
    quote: "Ótima barbearia. Atendimento excelente, profissionais muito bons, ambiente aconchegante. Estou frequentando há mais de um ano, só tenho a agradecer.",
    author: "Pato Marques",
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
      <span
        className="absolute top-4 left-6 text-gold opacity-25 font-heading text-7xl leading-none select-none"
        aria-hidden="true"
      >
        &#8220;
      </span>
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
