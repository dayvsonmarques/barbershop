import { NextRequest, NextResponse } from "next/server";

type InstagramMediaItem = {
  id: string;
  caption?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  media_type?: string;
};

export async function GET(request: NextRequest) {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const userId = process.env.INSTAGRAM_USER_ID;

    if (!accessToken || !userId) {
      return NextResponse.json({ data: [], warning: "Instagram não configurado" });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 6), 1), 12);

    const fields = [
      "id",
      "caption",
      "media_url",
      "thumbnail_url",
      "permalink",
      "media_type",
    ].join(",");

    const url = new URL(`https://graph.instagram.com/${userId}/media`);
    url.searchParams.set("fields", fields);
    url.searchParams.set("access_token", accessToken);
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString(), {
      // Avoid Next.js caching a token-protected response unexpectedly
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const json = (await response.json()) as { data?: InstagramMediaItem[] };
    const items = (json.data ?? []).filter((i) => i.permalink && (i.media_url || i.thumbnail_url));

    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("Error fetching Instagram feed:", error);
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
