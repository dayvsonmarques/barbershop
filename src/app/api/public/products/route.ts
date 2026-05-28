import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const limit = searchParams.get("limit");

  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(categoryId && /^\d+$/.test(categoryId) ? { categoryId: parseInt(categoryId, 10) } : {}),
      },
      take: limit && /^\d+$/.test(limit) ? parseInt(limit, 10) : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    });

    return NextResponse.json({ data: products });
  } catch (error) {
    console.error("Error fetching public products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
