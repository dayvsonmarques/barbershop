import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guards";
import { establishmentSettingsSchema } from "@/lib/validations/settings";

function safeParseOpeningHours(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "settings", "view");
  if (auth instanceof NextResponse) return auth;

  try {
    const settings = await prisma.establishmentSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: settings.id,
      name: settings.name,
      openingHours: safeParseOpeningHours(settings.openingHours),
      address: settings.address,
      latitude: Number(settings.latitude),
      longitude: Number(settings.longitude),
      instagramUrl: settings.instagramUrl,
      instagramUsername: settings.instagramUsername,
      phone: settings.phone,
      email: settings.email,
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission(request, "settings", "update");
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();

    const validation = establishmentSettingsSchema.safeParse({
      ...body,
      latitude: typeof body.latitude === "string" ? Number(body.latitude) : body.latitude,
      longitude: typeof body.longitude === "string" ? Number(body.longitude) : body.longitude,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const updated = await prisma.establishmentSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        name: validation.data.name,
        openingHours: JSON.stringify(validation.data.openingHours),
        address: validation.data.address,
        latitude: validation.data.latitude,
        longitude: validation.data.longitude,
        instagramUrl: validation.data.instagramUrl ?? null,
        instagramUsername: validation.data.instagramUsername ?? null,
        phone: validation.data.phone ?? null,
        email: validation.data.email ?? null,
      },
      update: {
        name: validation.data.name,
        openingHours: JSON.stringify(validation.data.openingHours),
        address: validation.data.address,
        latitude: validation.data.latitude,
        longitude: validation.data.longitude,
        instagramUrl: validation.data.instagramUrl ?? null,
        instagramUsername: validation.data.instagramUsername ?? null,
        phone: validation.data.phone ?? null,
        email: validation.data.email ?? null,
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      openingHours: safeParseOpeningHours(updated.openingHours),
      address: updated.address,
      latitude: Number(updated.latitude),
      longitude: Number(updated.longitude),
      instagramUrl: updated.instagramUrl,
      instagramUsername: updated.instagramUsername,
      phone: updated.phone,
      email: updated.email,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
