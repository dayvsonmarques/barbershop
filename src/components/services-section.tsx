// src/components/services-section.tsx
import { SectionLabel } from "@/components/ui/section-label";

type Service = {
  title: string;
  description: string;
  price: string;
};

const services: Service[] = [
  {
    title: "Corte Clássico",
    description: "Corte tradicional com navalha e acabamento perfeito.",
    price: "R$ 45",
  },
  {
    title: "Barba Completa",
    description: "Modelagem e hidratação com produtos premium.",
    price: "R$ 35",
  },
  {
    title: "Corte + Barba",
    description: "Combo completo com relaxamento de couro cabeludo.",
    price: "R$ 70",
  },
  {
    title: "Degradê",
    description: "Fade moderno com transições precisas.",
    price: "R$ 50",
  },
  {
    title: "Sobrancelha",
    description: "Design e modelagem com navalha.",
    price: "R$ 20",
  },
  {
    title: "Hidratação",
    description: "Tratamento intensivo para cabelo e barba.",
    price: "R$ 40",
  },
];

function ServiceCard({ title, description, price }: Service) {
  return (
    <div className="bg-background-secondary border-t-2 border-gold p-6 hover:bg-background-tertiary transition-colors duration-300">
      <h3 className="font-heading text-text-primary text-xl mb-2">{title}</h3>
      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        {description}
      </p>
      <span className="text-gold font-semibold text-lg">{price}</span>
    </div>
  );
}

export function ServicesSection() {
  return (
    <section id="servicos" className="bg-background-primary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel label="Serviços" />
        <h2
          className="font-heading text-text-primary mb-12"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          O que oferecemos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {services.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
}
