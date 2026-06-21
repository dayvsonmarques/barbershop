import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "bookings", "view");
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search");

  const where: Prisma.OrderWhereInput = {};

  if (status && ["PENDING", "PAID", "CANCELLED"].includes(status)) {
    where.status = status as "PENDING" | "PAID" | "CANCELLED";
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json(orders);
}
