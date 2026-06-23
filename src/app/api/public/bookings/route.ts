import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendWhatsApp, bookingConfirmationMessage } from "@/lib/sms";
import { checkRateLimit } from "@/lib/rate-limit";

const bookingSchema = z.object({
  serviceId: z.string(),
  barberId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  clientName: z.string().min(2).max(100),
  clientPhone: z.string().min(8).max(20),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = bookingSchema.parse(body);

    // 5 bookings per phone per hour
    const rl = checkRateLimit(`booking:${validated.clientPhone.replace(/\D/g, "")}`, { maxRequests: 5, windowMs: 60 * 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
    }

    // Parse date and time
    const [year, month, day] = validated.date.split("-").map(Number);
    const [hour, minute] = validated.time.split(":").map(Number);
    const scheduledAt = new Date(year, month - 1, day, hour, minute);

    // Check if datetime is in the past
    if (scheduledAt < new Date()) {
      return NextResponse.json(
        { error: "Não é possível agendar horários no passado" },
        { status: 400 }
      );
    }

    // Check if datetime is more than 7 days in the future
    const maxAllowed = new Date();
    maxAllowed.setDate(maxAllowed.getDate() + 6);
    maxAllowed.setHours(23, 59, 59, 999);
    if (scheduledAt > maxAllowed) {
      return NextResponse.json(
        { error: "Agendamentos só podem ser feitos com até 7 dias de antecedência" },
        { status: 400 }
      );
    }

    // Get service duration
    const service = await prisma.service.findUnique({
      where: { id: parseInt(validated.serviceId) },
      select: { duration: true, isActive: true },
    });

    if (!service || !service.isActive) {
      return NextResponse.json(
        { error: "Serviço não encontrado ou inativo" },
        { status: 404 }
      );
    }

    // Check barber is active
    const barber = await prisma.barber.findUnique({
      where: { id: parseInt(validated.barberId) },
      select: { isActive: true },
    });

    if (!barber || !barber.isActive) {
      return NextResponse.json(
        { error: "Barbeiro não encontrado ou inativo" },
        { status: 404 }
      );
    }

    // Calculate end time
    const endTime = new Date(scheduledAt);
    endTime.setMinutes(endTime.getMinutes() + service.duration);

    // Check for conflicts - use transaction to ensure atomicity
    const booking = await prisma.$transaction(async (tx) => {
      // Check for conflicts again inside transaction
      const conflicts = await tx.booking.findMany({
        where: {
          barberId: parseInt(validated.barberId),
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
          OR: [
            {
              // New booking starts during an existing booking
              scheduledAt: {
                lte: scheduledAt,
              },
              // Calculated end time would be after new booking start
            },
            {
              // New booking ends after an existing booking starts
              scheduledAt: {
                gte: scheduledAt,
                lt: endTime,
              },
            },
          ],
        },
        include: {
          service: {
            select: {
              duration: true,
            },
          },
        },
      });

      // Additional conflict check considering service durations
      for (const conflict of conflicts) {
        const conflictEnd = new Date(conflict.scheduledAt);
        conflictEnd.setMinutes(
          conflictEnd.getMinutes() + conflict.service.duration
        );

        if (
          (scheduledAt >= conflict.scheduledAt && scheduledAt < conflictEnd) ||
          (endTime > conflict.scheduledAt && endTime <= conflictEnd) ||
          (scheduledAt <= conflict.scheduledAt && endTime >= conflictEnd)
        ) {
          throw new Error("Horário não disponível. Por favor, escolha outro.");
        }
      }

      // Create booking
      return await tx.booking.create({
        data: {
          scheduledAt,
          serviceId: parseInt(validated.serviceId),
          barberId: parseInt(validated.barberId),
          customerName: validated.clientName,
          customerPhone: validated.clientPhone,
          status: "PENDING",
        },
        include: {
          service: {
            select: {
              name: true,
              price: true,
            },
          },
          barber: {
            select: {
              name: true,
            },
          },
        },
      });
    });

    if (validated.clientPhone) {
      const dateFormatted = new Date(scheduledAt).toLocaleDateString("pt-BR");
      const timeFormatted = validated.time;
      sendWhatsApp(
        validated.clientPhone,
        bookingConfirmationMessage({
          customerName: validated.clientName,
          serviceName: booking.service.name,
          barberName: booking.barber.name,
          date: dateFormatted,
          time: timeFormatted,
        })
      ).catch((err) => console.error("WhatsApp error:", err));
    }

    return NextResponse.json(
      {
        message: "Agendamento criado com sucesso",
        data: booking,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating booking:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    if (error.message.includes("não disponível")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Erro ao criar agendamento" },
      { status: 500 }
    );
  }
}
