import { NextRequest, NextResponse } from "next/server";

type BeholdPost = {
  id: string;
  caption?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  permalink?: string;
  mediaType?: string;
};

export async function GET(request: NextRequest) {
  const widgetId = process.env.BEHOLD_WIDGET_ID;

  if (!widgetId) {
    return NextResponse.json({ data: [], warning: "Instagram não configurado" });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 6), 1), 12);

    const res = await fetch(`https://feeds.behold.so/${widgetId}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ data: [] });
    }

    const posts = (await res.json()) as BeholdPost[];
    const items = posts
      .filter((p) => p.permalink && (p.mediaUrl || p.thumbnailUrl))
      .slice(0, limit)
      .map((p) => ({
        id: p.id,
        caption: p.caption,
        media_url: p.mediaUrl,
        thumbnail_url: p.thumbnailUrl,
        permalink: p.permalink,
        media_type: p.mediaType,
      }));

    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("Error fetching Instagram feed:", error);
    return NextResponse.json({ data: [] });
  }
}
