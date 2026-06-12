import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "bookings", "view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const search    = searchParams.get("search") ?? "";
    const barberId  = searchParams.get("barberId");
    const serviceId = searchParams.get("serviceId");
    const startDate = searchParams.get("startDate");
    const endDate   = searchParams.get("endDate");
    const page      = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
    const limit     = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));

    const where: any = { status: "COMPLETED" };

    if (search) {
      where.customerName = { contains: search, mode: "insensitive" };
    }
    if (barberId) {
      where.barberId = parseInt(barberId, 10);
    }
    if (serviceId) {
      where.serviceId = parseInt(serviceId, 10);
    }
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
    }

    const [total, items] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        orderBy: { scheduledAt: "desc" },
        skip: page * limit,
        take: limit,
        include: {
          service: { select: { id: true, name: true, duration: true, price: true } },
          barber:  { select: { id: true, name: true } },
        },
      }),
    ]);

    return NextResponse.json({ total, page, limit, items });
  } catch (error) {
    console.error("Error fetching atendimentos:", error);
    return NextResponse.json({ error: "Failed to fetch atendimentos" }, { status: 500 });
  }
}
