import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "bookings", "view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const page   = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
    const limit  = Math.min(200, parseInt(searchParams.get("limit") ?? "50", 10));

    const searchFilter = search
      ? Prisma.sql`AND (b."customerName" ILIKE ${`%${search}%`} OR b."customerPhone" ILIKE ${`%${search}%`})`
      : Prisma.empty;

    const rows = await prisma.$queryRaw<{
      customerPhone:   string;
      customerName:    string;
      totalVisits:     bigint;
      completedVisits: bigint;
      firstVisit:      Date;
      lastVisit:       Date;
      totalSpent:      string;
    }[]>`
      SELECT
        b."customerPhone",
        (ARRAY_AGG(b."customerName" ORDER BY b."scheduledAt" DESC))[1] AS "customerName",
        COUNT(*)                                                         AS "totalVisits",
        COUNT(*) FILTER (WHERE b.status = 'COMPLETED')                  AS "completedVisits",
        MIN(b."scheduledAt")                                            AS "firstVisit",
        MAX(b."scheduledAt")                                            AS "lastVisit",
        COALESCE(SUM(
          CASE WHEN b.status = 'COMPLETED' THEN s.price ELSE 0 END
        ), 0)::text                                                      AS "totalSpent"
      FROM bookings b
      JOIN services s ON s.id = b."serviceId"
      WHERE b."customerPhone" IS NOT NULL
        ${searchFilter}
      GROUP BY b."customerPhone"
      ORDER BY "lastVisit" DESC
      LIMIT ${limit} OFFSET ${page * limit}
    `;

    const countRows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT b."customerPhone") AS count
      FROM bookings b
      WHERE b."customerPhone" IS NOT NULL
        ${searchFilter}
    `;

    const customers = rows.map((r) => ({
      customerPhone:   r.customerPhone,
      customerName:    r.customerName,
      totalVisits:     Number(r.totalVisits),
      completedVisits: Number(r.completedVisits),
      firstVisit:      r.firstVisit,
      lastVisit:       r.lastVisit,
      totalSpent:      parseFloat(r.totalSpent),
    }));

    return NextResponse.json({ total: Number(countRows[0]?.count ?? 0), page, limit, customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
