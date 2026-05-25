import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { categoryIcons, fallbackIcon } from "@/lib/category-icons";

async function getCategories() {
  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { services: { where: { isActive: true } } } },
    },
    orderBy: { id: "asc" },
  });
  return categories.filter((c) => c._count.services > 0);
}

export async function ServicesSection() {
  const categories = await getCategories();

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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-px bg-border mb-10">
          {categories.map((category) => (
            <Link
              key={category.id}
              href="/servicos"
              className="bg-background-secondary hover:bg-background-tertiary transition-colors duration-300 flex flex-col items-center justify-center gap-4 py-10 px-4 group"
            >
              <span className="text-gold transition-transform duration-300 group-hover:scale-110">
                {categoryIcons[category.name] ?? fallbackIcon}
              </span>
              <span className="font-heading text-text-primary text-sm uppercase tracking-widest text-center">
                {category.name}
              </span>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link href="/servicos">
            <Button variant="outline" size="lg">
              Ver todos os serviços
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
