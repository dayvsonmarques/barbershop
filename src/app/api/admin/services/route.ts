import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { serviceSchema } from "@/lib/validations/services";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "services", "view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const categoryIdParam = searchParams.get("categoryId");

    const where = categoryIdParam
      ? { categoryId: parseInt(categoryIdParam, 10) }
      : {};

    const services = await prisma.service.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "services", "create");
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const validation = serviceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.serviceCategory.findUnique({
      where: { id: validation.data.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const service = await prisma.service.create({
      data: validation.data,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
