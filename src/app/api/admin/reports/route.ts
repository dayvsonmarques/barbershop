import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getPeriodStart(period: string): Date {
  const now = new Date();
  switch (period) {
    case "4w":  return new Date(now.getTime() - 28 * 86400000);
    case "6m":  return new Date(now.getFullYear(), now.getMonth() - 5, 1);
    case "12m": return new Date(now.getFullYear(), now.getMonth() - 11, 1);
    default:    return new Date(now.getFullYear(), now.getMonth() - 2, 1); // 3m
  }
}

function bucketLabel(date: Date, period: string): string {
  if (period === "4w") {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function bucketKey(date: Date, period: string): string {
  if (period === "4w") {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - d.getDay()); // week start (Sun)
    return d.toISOString().slice(0, 10);
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "bookings", "view");
  if (auth instanceof NextResponse) return auth;

  const period = request.nextUrl.searchParams.get("period") ?? "3m";
  const start = getPeriodStart(period);
  const end = new Date();

  const bookings = await prisma.booking.findMany({
    where: { scheduledAt: { gte: start, lte: end }, isActive: true },
    select: {
      scheduledAt: true,
      status: true,
      customerPhone: true,
      customerEmail: true,
      service: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const total = bookings.length;
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED").length;
  const cancelled = bookings.filter((b) => b.status === "CANCELLED").length;
  const cancelRate = total > 0 ? Math.round((cancelled / total) * 100 * 10) / 10 : 0;

  // Unique clients (by phone, fallback email)
  const clientIds = new Set(bookings.map((b) => b.customerPhone ?? b.customerEmail ?? "anon"));
  const uniqueClients = clientIds.size;

  // New vs returning: clients who had bookings BEFORE this period
  const allPreviousIds = await prisma.booking.findMany({
    where: { scheduledAt: { lt: start }, isActive: true },
    select: { customerPhone: true, customerEmail: true },
  });
  const previousSet = new Set(allPreviousIds.map((b) => b.customerPhone ?? b.customerEmail ?? "anon"));
  const newClients = [...clientIds].filter((id) => !previousSet.has(id)).length;
  const returningClients = uniqueClients - newClients;

  // Volume by bucket
  type BucketEntry = { label: string; total: number; confirmed: number };
  const bucketMap = new Map<string, BucketEntry>();
  for (const b of bookings) {
    const key = bucketKey(new Date(b.scheduledAt), period);
    if (!bucketMap.has(key)) {
      bucketMap.set(key, { label: bucketLabel(new Date(b.scheduledAt), period), total: 0, confirmed: 0 });
    }
    const entry = bucketMap.get(key)!;
    entry.total++;
    if (b.status === "CONFIRMED" || b.status === "COMPLETED") entry.confirmed++;
  }
  const volume = Array.from(bucketMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  // By day of week
  const dayCount = Array(7).fill(0);
  for (const b of bookings) {
    if (b.status !== "CANCELLED") dayCount[new Date(b.scheduledAt).getDay()]++;
  }
  const byDayOfWeek = DAY_LABELS.map((label, i) => ({ label, count: dayCount[i] }));

  // By hour (7–20)
  const hourCount: Record<number, number> = {};
  for (let h = 7; h <= 20; h++) hourCount[h] = 0;
  for (const b of bookings) {
    if (b.status !== "CANCELLED") {
      const h = new Date(b.scheduledAt).getHours();
      if (h >= 7 && h <= 20) hourCount[h]++;
    }
  }
  const byHour = Object.entries(hourCount).map(([h, count]) => ({ hour: Number(h), count }));

  // Top services
  const svcMap = new Map<number, { name: string; count: number }>();
  for (const b of bookings) {
    if (b.status !== "CANCELLED") {
      const { id, name } = b.service;
      const e = svcMap.get(id) ?? { name, count: 0 };
      e.count++;
      svcMap.set(id, e);
    }
  }
  const topServices = Array.from(svcMap.values()).sort((a, b) => b.count - a.count).slice(0, 5);

  return NextResponse.json({
    stats: { total, confirmed, cancelled, cancelRate, uniqueClients, newClients, returningClients },
    volume,
    byDayOfWeek,
    byHour,
    topServices,
  });
}
