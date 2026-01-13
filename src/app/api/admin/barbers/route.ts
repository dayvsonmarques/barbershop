import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { barberSchema } from "@/lib/validations/barbers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "barbers", "view");
  if (auth instanceof NextResponse) return auth;

  try {
    const barbers = await prisma.barber.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            availability: true,
            bookings: true,
          },
        },
      },
    });

    return NextResponse.json(barbers);
  } catch (error) {
    console.error("Error fetching barbers:", error);
    return NextResponse.json(
      { error: "Failed to fetch barbers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "barbers", "create");
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const validation = barberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const barber = await prisma.barber.create({
      data: validation.data,
    });

    return NextResponse.json(barber, { status: 201 });
  } catch (error) {
    console.error("Error creating barber:", error);
    return NextResponse.json(
      { error: "Failed to create barber" },
      { status: 500 }
    );
  }
}
