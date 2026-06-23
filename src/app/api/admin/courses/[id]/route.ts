import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { courseSchema } from "@/lib/validations/products-courses";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(request, "courses", "update");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const courseId = parseInt(id);
  if (isNaN(courseId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const body = await request.json();
    const validation = courseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.issues }, { status: 400 });
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: validation.data,
    });
    return NextResponse.json(course);
  } catch {
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(request, "courses", "delete");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const courseId = parseInt(id);
  if (isNaN(courseId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    await prisma.course.update({ where: { id: courseId }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
