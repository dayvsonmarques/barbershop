import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const barberId = searchParams.get("barberId");
    const serviceId = searchParams.get("serviceId");
    const dateStr = searchParams.get("date");

    if (!barberId || !serviceId || !dateStr) {
      return NextResponse.json(
        { error: "barberId, serviceId e date são obrigatórios" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Map JS day of week to Prisma DayOfWeek enum
    const dayMap = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ] as const;
    const dayOfWeekEnum = dayMap[dayOfWeek];

    // Get service duration
    const service = await prisma.service.findUnique({
      where: { id: parseInt(serviceId) },
      select: { duration: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Serviço não encontrado" },
        { status: 404 }
      );
    }

    // Get barber's availability for this day of week
    const availability = await prisma.barberAvailability.findFirst({
      where: {
        barberId: parseInt(barberId),
        OR: [
          {
            serviceId: parseInt(serviceId),
          },
          {
            serviceId: null, // Available for all services
          },
        ],
        recurrenceType: "WEEKLY",
        dayOfWeek: dayOfWeekEnum,
        isActive: true,
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    if (!availability) {
      return NextResponse.json({ slots: [] });
    }

    // Check for exceptions (holidays, days off, etc.)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const exception = await prisma.availabilityException.findFirst({
      where: {
        barberId: parseInt(barberId),
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (exception) {
      return NextResponse.json({ slots: [] }); // No availability on this exception date
    }

    // Get existing bookings for this barber on this date
    const existingBookings = await prisma.booking.findMany({
      where: {
        barberId: parseInt(barberId),
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      include: {
        service: {
          select: {
            duration: true,
          },
        },
      },
    });

    // Generate time slots
    const slots: string[] = [];
    const startHour = parseInt(availability.startTime.split(":")[0]);
    const startMinute = parseInt(availability.startTime.split(":")[1]);
    const endHour = parseInt(availability.endTime.split(":")[0]);
    const endMinute = parseInt(availability.endTime.split(":")[1]);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const serviceDuration = service.duration;

    // Generate slots in 30-minute intervals
    for (
      let minutes = startMinutes;
      minutes + serviceDuration <= endMinutes;
      minutes += 30
    ) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeStr = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;

      // Check if this slot conflicts with existing bookings
      const slotStart = minutes;
      const slotEnd = minutes + serviceDuration;

      const hasConflict = existingBookings.some((booking) => {
        const bookingDate = new Date(booking.scheduledAt);
        const bookingMinutes =
          bookingDate.getHours() * 60 + bookingDate.getMinutes();
        const bookingEnd = bookingMinutes + booking.service.duration;

        // Check for overlap
        return (
          (slotStart >= bookingMinutes && slotStart < bookingEnd) ||
          (slotEnd > bookingMinutes && slotEnd <= bookingEnd) ||
          (slotStart <= bookingMinutes && slotEnd >= bookingEnd)
        );
      });

      if (!hasConflict) {
        slots.push(timeStr);
      }
    }

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Erro ao carregar disponibilidade" },
      { status: 500 }
    );
  }
}
