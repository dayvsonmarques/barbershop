import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { reorderSchema } from "@/lib/validations/testimonials";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "testimonials", "update");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = reorderSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.issues },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    validation.data.map(({ id, position }) =>
      prisma.testimonial.update({ where: { id }, data: { position } })
    )
  );

  return NextResponse.json({ ok: true });
}
