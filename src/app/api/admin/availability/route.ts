import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guards";
import {
  availabilityExceptionSchema,
  availabilityRuleSchema,
} from "@/lib/validations/availability";

type Kind = "rule" | "exception";

const createBodySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("rule"), data: availabilityRuleSchema }),
  z.object({ kind: z.literal("exception"), data: availabilityExceptionSchema }),
]);

const updateBodySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("rule"), id: z.number().int().positive(), data: availabilityRuleSchema }),
  z.object({
    kind: z.literal("exception"),
    id: z.number().int().positive(),
    data: availabilityExceptionSchema,
  }),
]);

function parseIntParam(value: string | null) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "barbers", "view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const barberId = parseIntParam(searchParams.get("barberId"));

    if (!barberId) {
      return NextResponse.json(
        { error: "barberId é obrigatório" },
        { status: 400 }
      );
    }

    const [availability, exceptions] = await Promise.all([
      prisma.barberAvailability.findMany({
        where: { barberId },
        orderBy: [{ recurrenceType: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
        include: {
          service: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.availabilityException.findMany({
        where: { barberId },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      }),
    ]);

    return NextResponse.json({ availability, exceptions });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "barbers", "update");
  if (auth instanceof NextResponse) return auth;

  try {
    const raw = (await request.json()) as unknown;
    const parsed = createBodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    if (parsed.data.kind === "rule") {
      const created = await prisma.barberAvailability.create({
        data: {
          barberId: parsed.data.data.barberId,
          serviceId: parsed.data.data.serviceId ?? null,
          recurrenceType: parsed.data.data.recurrenceType,
          dayOfWeek: parsed.data.data.dayOfWeek ?? null,
          dayOfMonth: parsed.data.data.dayOfMonth ?? null,
          startTime: parsed.data.data.startTime,
          endTime: parsed.data.data.endTime,
          isActive: parsed.data.data.isActive ?? true,
        },
      });
      return NextResponse.json(created, { status: 201 });
    }

    const date = new Date(parsed.data.data.date);
    const created = await prisma.availabilityException.create({
      data: {
        barberId: parsed.data.data.barberId,
        date,
        type: parsed.data.data.type,
        startTime: parsed.data.data.startTime ?? null,
        endTime: parsed.data.data.endTime ?? null,
        reason: parsed.data.data.reason ?? null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Já existe exceção cadastrada para esta data" },
          { status: 409 }
        );
      }
    }

    console.error("Error creating availability item:", error);
    return NextResponse.json(
      { error: "Failed to create availability item" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission(request, "barbers", "update");
  if (auth instanceof NextResponse) return auth;

  try {
    const raw = (await request.json()) as unknown;
    const parsed = updateBodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    if (parsed.data.kind === "rule") {
      const updated = await prisma.barberAvailability.update({
        where: { id: parsed.data.id },
        data: {
          barberId: parsed.data.data.barberId,
          serviceId: parsed.data.data.serviceId ?? null,
          recurrenceType: parsed.data.data.recurrenceType,
          dayOfWeek: parsed.data.data.dayOfWeek ?? null,
          dayOfMonth: parsed.data.data.dayOfMonth ?? null,
          startTime: parsed.data.data.startTime,
          endTime: parsed.data.data.endTime,
          isActive: parsed.data.data.isActive ?? true,
        },
      });

      return NextResponse.json(updated);
    }

    const date = new Date(parsed.data.data.date);
    const updated = await prisma.availabilityException.update({
      where: { id: parsed.data.id },
      data: {
        barberId: parsed.data.data.barberId,
        date,
        type: parsed.data.data.type,
        startTime: parsed.data.data.startTime ?? null,
        endTime: parsed.data.data.endTime ?? null,
        reason: parsed.data.data.reason ?? null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating availability item:", error);
    return NextResponse.json(
      { error: "Failed to update availability item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission(request, "barbers", "update");
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const kind = (searchParams.get("kind") ?? "") as Kind;
    const id = parseIntParam(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }

    if (kind === "rule") {
      await prisma.barberAvailability.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }

    if (kind === "exception") {
      await prisma.availabilityException.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "kind inválido (use rule|exception)" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error deleting availability item:", error);
    return NextResponse.json(
      { error: "Failed to delete availability item" },
      { status: 500 }
    );
  }
}
