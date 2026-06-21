import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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
