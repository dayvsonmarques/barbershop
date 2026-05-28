import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SectionLabel } from "@/components/ui/section-label";
import { ProductCard } from "@/components/product-card";
import { prisma } from "@/lib/prisma";

async function getData(categoryId?: string) {
  const [categories, products] = await Promise.all([
    prisma.productCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(categoryId && /^\d+$/.test(categoryId) ? { categoryId: parseInt(categoryId, 10) } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    }),
  ]);
  return { categories, products };
}

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const { categories, products } = await getData(category);

  return (
    <div className="min-h-screen bg-background-primary">
      <Navbar />
      <section className="max-w-7xl mx-auto px-6 py-24">
        <SectionLabel label="Loja" />
        <h1
          className="font-heading text-text-primary mb-3"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          Produtos
        </h1>
        <p className="text-text-secondary text-lg mb-10">
          Pomadas, óleos e produtos de qualidade profissional.
        </p>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          <a
            href="/produtos"
            className={`px-4 py-1.5 text-sm border transition-colors ${!category ? "border-gold bg-gold text-background-primary" : "border-border text-text-secondary hover:border-gold hover:text-gold"}`}
          >
            Todos
          </a>
          {categories.map((c) => (
            <a
              key={c.id}
              href={`/produtos?category=${c.id}`}
              className={`px-4 py-1.5 text-sm border transition-colors ${category === String(c.id) ? "border-gold bg-gold text-background-primary" : "border-border text-text-secondary hover:border-gold hover:text-gold"}`}
            >
              {c.name}
            </a>
          ))}
        </div>

        {products.length === 0 ? (
          <p className="text-text-secondary py-12 text-center">Nenhum produto encontrado.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                name={p.name}
                slug={p.slug}
                price={Number(p.price)}
                discountPrice={p.discountPrice ? Number(p.discountPrice) : null}
                primaryImageUrl={p.images[0]?.url ?? null}
              />
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
