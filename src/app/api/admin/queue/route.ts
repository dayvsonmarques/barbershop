import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "bookings", "view");
  if (auth instanceof NextResponse) return auth;

  const count = await prisma.booking.count({ where: { status: "PENDING", isActive: true } });

  return NextResponse.json({ count });
}
