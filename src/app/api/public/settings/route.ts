import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function safeParseOpeningHours(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

export async function GET() {
  try {
    const settings = await prisma.establishmentSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    return NextResponse.json({
      data: {
        name: settings.name,
        openingHours: safeParseOpeningHours(settings.openingHours),
        address: settings.address,
        latitude: Number(settings.latitude),
        longitude: Number(settings.longitude),
        instagramUrl: settings.instagramUrl,
        instagramUsername: settings.instagramUsername,
        phone: settings.phone,
      },
    });
  } catch (error) {
    console.error("Error fetching public settings:", error);

    // Fallback para ambiente sem banco configurado (melhor UX no dev)
    return NextResponse.json(
      {
        data: {
          name: "ED Barbearia",
          openingHours: {
            monday: "09:00-18:00",
            tuesday: "09:00-18:00",
            wednesday: "09:00-18:00",
            thursday: "09:00-18:00",
            friday: "09:00-18:00",
            saturday: "09:00-14:00",
            sunday: "Fechado",
          },
          address: "Rua casa amarela,73, Recife, Brazil 52070330",
          latitude: -8.047562,
          longitude: -34.877,
          instagramUrl: "https://www.instagram.com/edbarbearia/",
          instagramUsername: "edbarbearia",
          phone: "(11) 99999-9999",
        },
        warning: "Banco de dados indisponível ou não configurado",
      },
      { status: 200 }
    );
  }
}
