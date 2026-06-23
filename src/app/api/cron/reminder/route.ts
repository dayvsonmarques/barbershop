import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsApp, bookingReminderMessage } from "@/lib/sms";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 55 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 65 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      scheduledAt: { gte: windowStart, lte: windowEnd },
      status: { in: ["PENDING", "CONFIRMED"] },
      reminderSent: false,
      customerPhone: { not: null },
    },
    include: {
      service: { select: { name: true } },
      barber: { select: { name: true } },
    },
  });

  const results = await Promise.allSettled(
    bookings.map(async (booking) => {
      const time = booking.scheduledAt.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Recife",
      });

      await sendWhatsApp(
        booking.customerPhone!,
        bookingReminderMessage({
          customerName: booking.customerName,
          serviceName: booking.service.name,
          barberName: booking.barber.name,
          time,
        })
      );

      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSent: true },
      });

      return booking.id;
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`[cron/reminder] sent=${sent} failed=${failed}`);
  return NextResponse.json({ sent, failed });
}
