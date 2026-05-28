import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { productSchema } from "@/lib/validations/products-courses";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string) {
  const n = parseInt(id, 10);
  return isNaN(n) ? null : n;
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, "products", "view");
  if (auth instanceof NextResponse) return auth;

  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      images: { orderBy: { position: "asc" } },
    },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, "products", "update");
  if (auth instanceof NextResponse) return auth;

  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await request.json();
  const validation = productSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.issues },
      { status: 400 }
    );
  }

  const { images, ...productData } = validation.data;

  try {
    const product = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: id } });
      return tx.product.update({
        where: { id },
        data: {
          ...productData,
          images: { create: images },
        },
        include: {
          category: { select: { id: true, name: true } },
          images: { orderBy: { position: "asc" } },
        },
      });
    });
    return NextResponse.json(product);
  } catch (error: any) {
    if (error.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, "products", "delete");
  if (auth instanceof NextResponse) return auth;

  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    throw error;
  }
}
