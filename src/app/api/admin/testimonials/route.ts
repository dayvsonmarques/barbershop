import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { testimonialSchema } from "@/lib/validations/testimonials";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "testimonials", "view");
  if (auth instanceof NextResponse) return auth;

  const testimonials = await prisma.testimonial.findMany({
    orderBy: { position: "asc" },
  });

  return NextResponse.json(testimonials);
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "testimonials", "create");
  if (auth instanceof NextResponse) return auth;

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

  const count = await prisma.testimonial.count();
  const testimonial = await prisma.testimonial.create({
    data: { ...validation.data, position: validation.data.position ?? count },
  });

  return NextResponse.json(testimonial, { status: 201 });
}
