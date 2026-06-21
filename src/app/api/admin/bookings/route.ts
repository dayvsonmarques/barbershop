import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { bookingSchema } from "@/lib/validations/bookings";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "bookings", "view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const barberIdParam  = searchParams.get("barberId");
    const serviceIdParam = searchParams.get("serviceId");
    const date           = searchParams.get("date");
    const startDate      = searchParams.get("startDate");
    const endDate        = searchParams.get("endDate");
    const status         = searchParams.get("status");
    const search         = searchParams.get("search");

    const where: any = { isActive: true };

    if (barberIdParam)  where.barberId  = parseInt(barberIdParam, 10);
    if (serviceIdParam) where.serviceId = parseInt(serviceIdParam, 10);
    if (status)         where.status    = status;
    if (search)         where.customerName = { contains: search, mode: "insensitive" };

    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) {
        const [y, m, d] = startDate.split("-").map(Number);
        where.scheduledAt.gte = new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      if (endDate) {
        const [y, m, d] = endDate.split("-").map(Number);
        where.scheduledAt.lte = new Date(y, m - 1, d, 23, 59, 59, 999);
      }
    } else if (date) {
      const [y, m, d] = date.split("-").map(Number);
      where.scheduledAt = {
        gte: new Date(y, m - 1, d, 0, 0, 0, 0),
        lte: new Date(y, m - 1, d, 23, 59, 59, 999),
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
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

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "bookings", "create");
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const validation = bookingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { serviceId, barberId, scheduledAt, customerName, customerEmail, customerPhone } =
      validation.data;

    // Get service to calculate end time
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Parse scheduled time
    const scheduled = new Date(scheduledAt);
    const endTime = new Date(scheduled.getTime() + service.duration * 60000);

    // Check for conflicts - barber busy at this time?
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        barberId,
        isActive: true,
        status: {
          notIn: ["CANCELLED"],
        },
        scheduledAt: {
          gte: new Date(scheduled.getTime() - service.duration * 60000),
          lt: endTime,
        },
      },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: "Conflicting booking exists for this time slot" },
        { status: 409 }
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        serviceId,
        barberId,
        scheduledAt: scheduled,
        customerName,
        customerEmail,
        customerPhone,
        status: "CONFIRMED",
        createdBy: auth.userId,
      },
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

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
