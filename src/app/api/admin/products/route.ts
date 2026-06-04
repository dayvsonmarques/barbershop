import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { productSchema } from "@/lib/validations/products-courses";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "products", "view");
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const categoryIdParam = searchParams.get("categoryId");
  const categoryId = categoryIdParam && /^\d+$/.test(categoryIdParam)
    ? parseInt(categoryIdParam, 10)
    : null;

  const products = await prisma.product.findMany({
    where: categoryId ? { categoryId } : {},
    orderBy: { name: "asc" },
    include: {
      category: { select: { id: true, name: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
  });

  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "products", "create");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const validation = productSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.issues },
      { status: 400 }
    );
  }

  const { images, ...productData } = validation.data;

  const product = await prisma.product.create({
    data: {
      ...productData,
      images: { create: images },
    },
    include: {
      category: { select: { id: true, name: true } },
      images: { orderBy: { position: "asc" } },
    },
  });

  return NextResponse.json(product, { status: 201 });
}
