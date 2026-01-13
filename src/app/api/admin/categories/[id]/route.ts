import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { categorySchema } from "@/lib/validations/services";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "services", "view");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) {
    return NextResponse.json(
      { error: "Invalid category ID" },
      { status: 400 }
    );
  }

  try {
    const category = await prisma.serviceCategory.findUnique({
      where: { id: categoryId },
      include: {
        services: {
          orderBy: { name: "asc" },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "services", "update");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) {
    return NextResponse.json(
      { error: "Invalid category ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const validation = categorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const category = await prisma.serviceCategory.update({
      where: { id: categoryId },
      data: validation.data,
    });

    return NextResponse.json(category);
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "services", "delete");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) {
    return NextResponse.json(
      { error: "Invalid category ID" },
      { status: 400 }
    );
  }

  try {
    // Check if category has services
    const category = await prisma.serviceCategory.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { services: true } } },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (category._count.services > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with services" },
        { status: 400 }
      );
    }

    await prisma.serviceCategory.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
