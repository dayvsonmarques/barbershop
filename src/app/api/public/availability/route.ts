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

    const [dy, dm, dd] = dateStr.split("-").map(Number);
    const date = new Date(dy, dm - 1, dd);

    // Reject dates beyond 2 weeks from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 13);
    if (date < today || date > maxDate) {
      return NextResponse.json({ slots: [] });
    }
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
    const startOfDay = new Date(dy, dm - 1, dd, 0, 0, 0, 0);
    const endOfDay = new Date(dy, dm - 1, dd, 23, 59, 59, 999);

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
        isActive: true,
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

    // Filter out blocked slots
    const blockedSlots = await prisma.blockedSlot.findMany({
      where: {
        barberId: parseInt(barberId),
        date: { gte: startOfDay, lte: endOfDay },
      },
      select: { time: true },
    });
    const blockedTimes = new Set(blockedSlots.map((b) => b.time));
    const unblocked = slots.filter((s) => !blockedTimes.has(s));

    // Strip past slots when the requested date is today
    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    const filtered = isToday
      ? unblocked.filter((slot) => {
          const [h, m] = slot.split(":").map(Number);
          return h * 60 + m > now.getHours() * 60 + now.getMinutes();
        })
      : unblocked;

    return NextResponse.json({ slots: filtered });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Erro ao carregar disponibilidade" },
      { status: 500 }
    );
  }
}
