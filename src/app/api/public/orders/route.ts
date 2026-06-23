import { NextResponse } from "next/server";
import { getCustomerFromCookie } from "@/lib/customer-jwt";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const customer = await getCustomerFromCookie();
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { customerPhone: customer.phone },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
              select: {
                name: true,
                slug: true,
                images: { select: { url: true }, where: { isPrimary: true }, take: 1 },
              },
            },
        },
      },
    },
  });

  return NextResponse.json(orders);
}
