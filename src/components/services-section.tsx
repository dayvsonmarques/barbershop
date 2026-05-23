// src/components/services-section.tsx
import { SectionLabel } from "@/components/ui/section-label";
import { prisma } from "@/lib/prisma";

async function getServices() {
  return prisma.service.findMany({
    where: { isActive: true },
    select: { id: true, name: true, description: true, price: true },
    orderBy: { id: "asc" },
  });
}

function ServiceCard({
  name,
  description,
  price,
}: {
  name: string;
  description: string | null;
  price: { toString(): string };
}) {
  const formatted = `R$ ${Number(price).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

  return (
    <div className="bg-background-secondary border-t-2 border-gold p-6 hover:bg-background-tertiary transition-colors duration-300">
      <h3 className="font-heading text-text-primary text-xl mb-2">{name}</h3>
      {description && (
        <p className="text-text-secondary text-sm mb-4 leading-relaxed">
          {description}
        </p>
      )}
      <span className="text-gold font-semibold text-lg">{formatted}</span>
    </div>
  );
}

export async function ServicesSection() {
  const services = await getServices();

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
            <ServiceCard key={service.id} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
}
