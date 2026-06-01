import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type InstagramMediaItem = {
  id: string;
  caption?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  media_type?: string;
};

const REFRESH_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function getRefreshedToken(
  currentToken: string,
  refreshedAt: Date | null
): Promise<string> {
  const needsRefresh =
    !refreshedAt ||
    Date.now() - refreshedAt.getTime() > REFRESH_INTERVAL_MS;

  if (!needsRefresh) return currentToken;

  try {
    const url = new URL("https://graph.instagram.com/refresh_access_token");
    url.searchParams.set("grant_type", "ig_refresh_token");
    url.searchParams.set("access_token", currentToken);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return currentToken;

    const data = (await res.json()) as { access_token?: string };
    const newToken = data.access_token;
    if (!newToken) return currentToken;

    await prisma.establishmentSettings.update({
      where: { id: 1 },
      data: {
        instagramAccessToken: newToken,
        instagramTokenRefreshedAt: new Date(),
      },
    });

    return newToken;
  } catch {
    return currentToken;
  }
}

export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.establishmentSettings.findUnique({
      where: { id: 1 },
      select: {
        instagramUserId: true,
        instagramAccessToken: true,
        instagramTokenRefreshedAt: true,
      },
    });

    const accessToken =
      settings?.instagramAccessToken ?? process.env.INSTAGRAM_ACCESS_TOKEN;
    const userId =
      settings?.instagramUserId ?? process.env.INSTAGRAM_USER_ID;

    if (!accessToken || !userId) {
      return NextResponse.json({ data: [], warning: "Instagram não configurado" });
    }

    const token = await getRefreshedToken(
      accessToken,
      settings?.instagramTokenRefreshedAt ?? null
    );

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 6), 1), 12);

    const fields = ["id", "caption", "media_url", "thumbnail_url", "permalink", "media_type"].join(",");

    const url = new URL(`https://graph.instagram.com/${userId}/media`);
    url.searchParams.set("fields", fields);
    url.searchParams.set("access_token", token);
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString(), { cache: "no-store" });

    if (!response.ok) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const json = (await response.json()) as { data?: InstagramMediaItem[] };
    const items = (json.data ?? []).filter(
      (i) => i.permalink && (i.media_url || i.thumbnail_url)
    );

    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("Error fetching Instagram feed:", error);
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
