import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PENDING", "PAID", "CANCELLED"]),
});

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, "bookings", "update");
  if (auth instanceof NextResponse) return auth;

  const rawId = (await params).id;
  if (!/^\d+$/.test(rawId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const id = parseInt(rawId, 10);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = updateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status: validation.data.status },
    });
    return NextResponse.json(order);
  } catch (error: any) {
    if (error.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    throw error;
  }
}
