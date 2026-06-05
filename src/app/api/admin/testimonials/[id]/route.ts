import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { testimonialSchema } from "@/lib/validations/testimonials";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string) {
  if (!/^\d+$/.test(id)) return null;
  return parseInt(id, 10);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, "testimonials", "update");
  if (auth instanceof NextResponse) return auth;

  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = testimonialSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.issues },
      { status: 400 }
    );
  }

  try {
    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: validation.data,
    });
    return NextResponse.json(testimonial);
  } catch (error: any) {
    if (error.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requirePermission(request, "testimonials", "delete");
  if (auth instanceof NextResponse) return auth;

  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    await prisma.testimonial.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    throw error;
  }
}
