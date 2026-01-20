import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json(
        { error: "serviceId é obrigatório" },
        { status: 400 }
      );
    }

    // Find barbers who have availability for this service
    const barbers = await prisma.barber.findMany({
      where: {
        isActive: true,
        availability: {
          some: {
            OR: [
              {
                serviceId: parseInt(serviceId),
              },
              {
                serviceId: null, // Available for all services
              },
            ],
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        bio: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ data: barbers });
  } catch (error) {
    console.error("Error fetching barbers:", error);
    return NextResponse.json(
      { error: "Erro ao carregar barbeiros" },
      { status: 500 }
    );
  }
}
