import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const DEFAULT_SITE_NAME = "Barbearia";

export function getSiteUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** Configurações públicas do estabelecimento, deduplicadas por request. */
export const getSiteSettings = cache(async () => {
  try {
    const s = await prisma.establishmentSettings.findUnique({ where: { id: 1 } });
    if (!s) return null;
    const lat = Number(s.latitude);
    const lng = Number(s.longitude);
    return {
      name: s.name || DEFAULT_SITE_NAME,
      address: s.address?.trim() || "",
      openingHours: s.openingHours,
      latitude: lat,
      longitude: lng,
      hasCoords: Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0),
      phone: s.phone,
      email: s.email,
      instagramUrl: s.instagramUsername
        ? `https://www.instagram.com/${s.instagramUsername}/`
        : s.instagramUrl,
      googleReviewUrl: s.googleReviewUrl,
    };
  } catch {
    return null;
  }
});

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
