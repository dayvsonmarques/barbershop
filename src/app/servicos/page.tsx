export const dynamic = "force-dynamic";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@/components/ui/calendar-icon";
import { SectionLabel } from "@/components/ui/section-label";
import { prisma } from "@/lib/prisma";
import { categoryIcons, fallbackIcon } from "@/lib/category-icons";

async function getServicesByCategory() {
  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    include: {
      services: {
        where: { isActive: true },
        select: { id: true, name: true, description: true, price: true, duration: true },
        orderBy: { id: "asc" },
      },
    },
    orderBy: { id: "asc" },
  });
  return categories.filter((c) => c.services.length > 0);
}

export default async function ServicosPage() {
  const categories = await getServicesByCategory();

  return (
    <div className="min-h-screen bg-background-primary">
      <Navbar />

      <section className="max-w-7xl mx-auto px-6 py-24">
        <SectionLabel label="Serviços" />
        <h1
          className="font-heading text-text-primary mb-3"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          Todos os Serviços
        </h1>
        <p className="text-text-secondary text-lg mb-16 leading-relaxed">
          Conheça tudo o que a ED Barbearia tem a oferecer.
        </p>

        <div className="space-y-16">
          {categories.map((category) => (
            <div key={category.id}>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-gold">
                  {categoryIcons[category.name] ?? fallbackIcon}
                </span>
                <h2 className="font-heading text-text-primary text-3xl uppercase tracking-widest">
                  {category.name}
                </h2>
                <div className="flex-1 h-px bg-border ml-2" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px">
                {category.services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-background-secondary p-6 hover:bg-background-tertiary transition-colors duration-300"
                  >
                    <h3 className="font-heading text-text-primary text-xl mb-2">
                      {service.name}
                    </h3>
                    <div className="flex items-start justify-between gap-4">
                      {service.description ? (
                        <p className="text-text-secondary text-base leading-relaxed">
                          {service.description}
                        </p>
                      ) : (
                        <span />
                      )}
                      <span className="text-gold font-semibold text-lg shrink-0">
                        R$ {Number(service.price).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    <span className="text-text-secondary text-sm mt-2 block">
                      {service.duration} min
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link href="/agendar">
            <Button variant="primary" size="lg">
              <CalendarIcon size={16} />
              Agendar Horário
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
