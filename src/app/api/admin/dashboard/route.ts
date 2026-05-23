import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "bookings", "view");
  if (auth instanceof NextResponse) return auth;

  try {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Run all queries in parallel
    const [
      bookingsToday,
      bookingsThisMonth,
      activeBarbers,
      bookingsByDay,
      bookingsByBarberRaw,
      upcomingBookings,
    ] = await Promise.all([
      // Count today's bookings (non-cancelled)
      prisma.booking.count({
        where: {
          scheduledAt: { gte: startOfToday, lte: endOfToday },
          status: { not: "CANCELLED" },
        },
      }),

      // This month's bookings with service prices for revenue
      prisma.booking.findMany({
        where: {
          scheduledAt: { gte: startOfMonth, lte: endOfMonth },
          status: { not: "CANCELLED" },
        },
        select: {
          scheduledAt: true,
          service: { select: { price: true } },
        },
      }),

      // Active barbers count
      prisma.barber.count({ where: { isActive: true } }),

      // All bookings this month grouped by day (for chart)
      prisma.booking.findMany({
        where: {
          scheduledAt: { gte: startOfMonth, lte: endOfMonth },
          status: { not: "CANCELLED" },
        },
        select: { scheduledAt: true },
        orderBy: { scheduledAt: "asc" },
      }),

      // Bookings this month grouped by barber (for chart)
      prisma.booking.findMany({
        where: {
          scheduledAt: { gte: startOfMonth, lte: endOfMonth },
          status: { not: "CANCELLED" },
        },
        select: {
          barber: { select: { id: true, name: true } },
        },
      }),

      // Next 5 upcoming bookings
      prisma.booking.findMany({
        where: {
          scheduledAt: { gte: now },
          status: { not: "CANCELLED" },
        },
        orderBy: { scheduledAt: "asc" },
        take: 5,
        select: {
          id: true,
          scheduledAt: true,
          customerName: true,
          service: { select: { name: true, duration: true } },
          barber: { select: { name: true } },
        },
      }),
    ]);

    // Revenue this month
    const revenueThisMonth = bookingsThisMonth.reduce((sum, b) => {
      return sum + Number(b.service.price);
    }, 0);

    // Build bookings-by-day series (fill gaps with 0)
    const daysInMonth = endOfMonth.getDate();
    const byDayMap = new Map<number, number>();
    for (const b of bookingsByDay) {
      const day = new Date(b.scheduledAt).getDate();
      byDayMap.set(day, (byDayMap.get(day) ?? 0) + 1);
    }
    const bookingsByDayChart = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      agendamentos: byDayMap.get(i + 1) ?? 0,
    }));

    // Build bookings-by-barber series
    const byBarberMap = new Map<string, { name: string; agendamentos: number }>();
    for (const b of bookingsByBarberRaw) {
      const key = String(b.barber.id);
      if (!byBarberMap.has(key)) {
        byBarberMap.set(key, { name: b.barber.name, agendamentos: 0 });
      }
      byBarberMap.get(key)!.agendamentos++;
    }
    const bookingsByBarberChart = Array.from(byBarberMap.values()).sort(
      (a, b) => b.agendamentos - a.agendamentos,
    );

    return NextResponse.json({
      stats: {
        bookingsToday,
        bookingsThisMonth: bookingsThisMonth.length,
        revenueThisMonth,
        activeBarbers,
      },
      charts: {
        bookingsByDay: bookingsByDayChart,
        bookingsByBarber: bookingsByBarberChart,
      },
      upcomingBookings,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to load dashboard stats" }, { status: 500 });
  }
}
