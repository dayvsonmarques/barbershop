import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guards";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "availability", "view");
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const barberId = searchParams.get("barberId");
  const date = searchParams.get("date");

  if (!barberId || !date) {
    return NextResponse.json({ error: "barberId e date são obrigatórios" }, { status: 400 });
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const slots = await prisma.blockedSlot.findMany({
    where: {
      barberId: parseInt(barberId),
      date: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { time: "asc" },
  });

  return NextResponse.json({ data: slots });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "availability", "update");
  if (auth instanceof NextResponse) return auth;

  const body = await request.json() as { barberId?: number; date?: string; time?: string; reason?: string };

  if (!body.barberId || !body.date || !body.time) {
    return NextResponse.json({ error: "barberId, date e time são obrigatórios" }, { status: 400 });
  }

  const slot = await prisma.blockedSlot.upsert({
    where: {
      barberId_date_time: {
        barberId: body.barberId,
        date: new Date(body.date),
        time: body.time,
      },
    },
    create: {
      barberId: body.barberId,
      date: new Date(body.date),
      time: body.time,
      reason: body.reason ?? null,
    },
    update: {
      reason: body.reason ?? null,
    },
  });

  return NextResponse.json({ data: slot });
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission(request, "availability", "update");
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const barberId = searchParams.get("barberId");
  const date = searchParams.get("date");
  const time = searchParams.get("time");

  if (!barberId || !date || !time) {
    return NextResponse.json({ error: "barberId, date e time são obrigatórios" }, { status: 400 });
  }

  await prisma.blockedSlot.deleteMany({
    where: {
      barberId: parseInt(barberId),
      date: new Date(date),
      time,
    },
  });

  return NextResponse.json({ ok: true });
}
