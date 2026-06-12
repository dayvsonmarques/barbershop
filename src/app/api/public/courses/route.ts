import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        durationHours: true,
        imageUrl: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
