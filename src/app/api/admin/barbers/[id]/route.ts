import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { barberSchema } from "@/lib/validations/barbers";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "barbers", "view");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const barberId = parseInt(id, 10);

  if (isNaN(barberId)) {
    return NextResponse.json(
      { error: "Invalid barber ID" },
      { status: 400 }
    );
  }

  try {
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      include: {
        availability: {
          orderBy: { dayOfWeek: "asc" },
        },
        exceptions: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!barber) {
      return NextResponse.json(
        { error: "Barber not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(barber);
  } catch (error) {
    console.error("Error fetching barber:", error);
    return NextResponse.json(
      { error: "Failed to fetch barber" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "barbers", "update");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const barberId = parseInt(id, 10);

  if (isNaN(barberId)) {
    return NextResponse.json(
      { error: "Invalid barber ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const validation = barberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const barber = await prisma.barber.update({
      where: { id: barberId },
      data: validation.data,
    });

    return NextResponse.json(barber);
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Barber not found" },
        { status: 404 }
      );
    }
    console.error("Error updating barber:", error);
    return NextResponse.json(
      { error: "Failed to update barber" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "barbers", "delete");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const barberId = parseInt(id, 10);

  if (isNaN(barberId)) {
    return NextResponse.json(
      { error: "Invalid barber ID" },
      { status: 400 }
    );
  }

  try {
    // Check if barber has bookings
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      include: { _count: { select: { bookings: true } } },
    });

    if (!barber) {
      return NextResponse.json(
        { error: "Barber not found" },
        { status: 404 }
      );
    }

    if (barber._count.bookings > 0) {
      return NextResponse.json(
        { error: "Cannot delete barber with bookings" },
        { status: 400 }
      );
    }

    await prisma.barber.delete({
      where: { id: barberId },
    });

    return NextResponse.json({ message: "Barber deleted successfully" });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Barber not found" },
        { status: 404 }
      );
    }
    console.error("Error deleting barber:", error);
    return NextResponse.json(
      { error: "Failed to delete barber" },
      { status: 500 }
    );
  }
}
