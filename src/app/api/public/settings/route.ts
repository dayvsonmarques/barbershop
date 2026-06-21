import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        openingHours: settings.openingHours,
        address: settings.address,
        latitude: Number(settings.latitude),
        longitude: Number(settings.longitude),
        instagramUrl: settings.instagramUsername
          ? `https://www.instagram.com/${settings.instagramUsername}/`
          : settings.instagramUrl,
        instagramUsername: settings.instagramUsername,
        phone: settings.phone,
        pixKey: settings.pixKey,
      },
    });
  } catch (error) {
    console.error("Error fetching public settings:", error);

    // Fallback para ambiente sem banco configurado (melhor UX no dev)
    return NextResponse.json(
      {
        data: {
          name: "ED Barbearia",
          openingHours: "Segunda a Sábado das 9h às 18h",
          address: "Rua casa amarela,73, Recife, Brasil, CEP: 52070-330",
          latitude: -8.0260634,
          longitude: -34.9196525,
          instagramUrl: "https://www.instagram.com/edbarbearia/",
          instagramUsername: "edbarbearia",
          phone: "(11) 99999-9999",
          pixKey: null,
        },
        warning: "Banco de dados indisponível ou não configurado",
      },
      { status: 200 }
    );
  }
}
