import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProductDetail } from "./_components/product-detail";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: { images: { where: { isPrimary: true }, take: 1 } },
  });
  if (!product) return {};
  return {
    title: `${product.name} | ED Barbearia`,
    description: product.description?.slice(0, 160) ?? product.name,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) ?? "",
      images: product.images[0] ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: { select: { id: true, name: true } },
      images: { orderBy: { position: "asc" } },
    },
  });

  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, isActive: true, id: { not: product.id } },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: { images: { where: { isPrimary: true }, take: 1 } },
  });

  const serialized = {
    ...product,
    price: Number(product.price),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
  };

  const serializedRelated = related.map((p) => ({
    ...p,
    price: Number(p.price),
    discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
  }));

  return (
    <>
      <Navbar />
      <ProductDetail product={serialized} related={serializedRelated} />
      <Footer />
    </>
  );
}
