// src/components/services-section.tsx
import { SectionLabel } from "@/components/ui/section-label";

type Service = {
  title: string;
  description: string;
  price: string;
};

const services: Service[] = [
  {
    title: "Corte",
    description: "Corte tradicional ou moderno com acabamento preciso.",
    price: "A partir de R$ 40",
  },
  {
    title: "Barba Completa",
    description: "Aparar, modelar e finalizar a barba com navalha.",
    price: "A partir de R$ 30",
  },
  {
    title: "Corte + Barba",
    description: "Combo completo de cabelo e barba.",
    price: "A partir de R$ 65",
  },
  {
    title: "Tintura",
    description: "Coloração profissional para cabelo ou barba.",
    price: "Consulte",
  },
  {
    title: "Penteados",
    description: "Finalização e estilização para qualquer ocasião.",
    price: "Consulte",
  },
  {
    title: "Sobrancelha",
    description: "Design e modelagem com navalha.",
    price: "A partir de R$ 20",
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
