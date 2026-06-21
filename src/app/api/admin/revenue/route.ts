import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

function getPeriodRange(period: string): { start: Date; end: Date; label: string } {
  const now = new Date();
  switch (period) {
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end, label: start.toLocaleString("pt-BR", { month: "long", year: "numeric" }) };
    }
    case "this_year": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end, label: String(now.getFullYear()) };
    }
    case "all":
      return { start: new Date(0), end: new Date(9999, 0), label: "Todo o período" };
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end, label: start.toLocaleString("pt-BR", { month: "long", year: "numeric" }) };
    }
  }
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "bookings", "view");
  if (auth instanceof NextResponse) return auth;

  const period = request.nextUrl.searchParams.get("period") ?? "this_month";
  const { start, end, label } = getPeriodRange(period);

  const bookings = await prisma.booking.findMany({
    where: {
      scheduledAt: { gte: start, lte: end },
      status: { notIn: ["CANCELLED", "PENDING"] },
      isActive: true,
    },
    select: {
      service: { select: { id: true, name: true, price: true } },
      barber:  { select: { id: true, name: true } },
    },
  });

  // Totals
  const total = bookings.reduce((s, b) => s + Number(b.service.price), 0);
  const count = bookings.length;
  const avg = count > 0 ? total / count : 0;

  // By barber
  const barberMap = new Map<number, { name: string; revenue: number; count: number }>();
  for (const b of bookings) {
    const { id, name } = b.barber;
    const entry = barberMap.get(id) ?? { name, revenue: 0, count: 0 };
    entry.revenue += Number(b.service.price);
    entry.count++;
    barberMap.set(id, entry);
  }
  const byBarber = Array.from(barberMap.values()).sort((a, b) => b.revenue - a.revenue);

  // By service
  const serviceMap = new Map<number, { name: string; revenue: number; count: number }>();
  for (const b of bookings) {
    const { id, name, price } = b.service;
    const entry = serviceMap.get(id) ?? { name, revenue: 0, count: 0 };
    entry.revenue += Number(price);
    entry.count++;
    serviceMap.set(id, entry);
  }
  const byService = Array.from(serviceMap.values()).sort((a, b) => b.revenue - a.revenue);

  return NextResponse.json({ label, total, count, avg, byBarber, byService });
}
