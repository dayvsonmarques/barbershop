import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { bookingUpdateSchema } from "@/lib/validations/bookings";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "bookings", "view");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        barber: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "bookings", "update");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const body = await request.json();
    const validation = bookingUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: validation.data,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
        barber: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(booking);
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "bookings", "delete");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    await prisma.booking.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Booking deleted successfully" });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}
