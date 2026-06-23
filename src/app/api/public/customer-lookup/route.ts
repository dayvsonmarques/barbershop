import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const rl = checkRateLimit(`lookup:${ip}`, { maxRequests: 20, windowMs: 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json({ name: null }, { status: 429 });
  }

  const phone = request.nextUrl.searchParams.get("phone")?.replace(/\D/g, "");
  if (!phone || phone.length < 10) {
    return NextResponse.json({ name: null });
  }

  const customer = await prisma.customer.findUnique({
    where: { phone },
    select: { name: true },
  });

  return NextResponse.json({ name: customer?.name ?? null });
}
