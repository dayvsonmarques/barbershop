import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { categorySchema } from "@/lib/validations/services";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "services", "view");
  if (auth instanceof NextResponse) return auth;

  try {
    const categories = await prisma.serviceCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "services", "create");
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const validation = categorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const category = await prisma.serviceCategory.create({
      data: validation.data,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
