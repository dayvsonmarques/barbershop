import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bookingSchema = z.object({
  serviceId: z.string(),
  barberId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  clientName: z.string().min(2).max(100),
  clientPhone: z.string().min(8).max(20),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = bookingSchema.parse(body);

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
