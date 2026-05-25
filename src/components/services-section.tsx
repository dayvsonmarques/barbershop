import { SectionLabel } from "@/components/ui/section-label";
import { prisma } from "@/lib/prisma";

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

const categoryIcons: Record<string, React.ReactNode> = {
  Corte: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  ),
  Barba: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18M9 3H5a2 2 0 00-2 2v4a10 10 0 0010 10 10 10 0 0010-10V5a2 2 0 00-2-2h-4" />
    </svg>
  ),
  Combo: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  ),
  Tratamento: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
    </svg>
  ),
  Estética: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

export async function ServicesSection() {
  const categories = await getServicesByCategory();

  return (
    <section id="servicos" className="bg-background-primary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel label="Serviços" />
        <h2
          className="font-heading text-text-primary mb-16"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          O que oferecemos
        </h2>

        <div className="space-y-16">
          {categories.map((category) => (
            <div key={category.id}>
              {/* Cabeçalho da categoria */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-gold">
                  {categoryIcons[category.name] ?? categoryIcons["Estética"]}
                </span>
                <h3 className="font-heading text-text-primary text-2xl uppercase tracking-widest">
                  {category.name}
                </h3>
                <div className="flex-1 h-px bg-border ml-2" />
              </div>

              {/* Serviços da categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-border">
                {category.services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-background-secondary p-6 hover:bg-background-tertiary transition-colors duration-300"
                  >
                    <h4 className="font-heading text-text-primary text-lg mb-1">
                      {service.name}
                    </h4>
                    {service.description && (
                      <p className="text-text-secondary text-sm mb-3 leading-relaxed">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-gold font-semibold">
                        R$ {Number(service.price).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                      </span>
                      <span className="text-text-secondary text-xs">
                        {service.duration} min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
