import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { serviceSchema } from "@/lib/validations/services";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "services", "view");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const serviceId = parseInt(id, 10);

  if (isNaN(serviceId)) {
    return NextResponse.json(
      { error: "Invalid service ID" },
      { status: 400 }
    );
  }

  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        category: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
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
  const serviceId = parseInt(id, 10);

  if (isNaN(serviceId)) {
    return NextResponse.json(
      { error: "Invalid service ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const validation = serviceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const service = await prisma.service.update({
      where: { id: serviceId },
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

    return NextResponse.json(service);
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
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
  const serviceId = parseInt(id, 10);

  if (isNaN(serviceId)) {
    return NextResponse.json(
      { error: "Invalid service ID" },
      { status: 400 }
    );
  }

  try {
    await prisma.service.delete({
      where: { id: serviceId },
    });

    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
