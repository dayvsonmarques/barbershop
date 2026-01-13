import { z } from "zod";

export const bookingSchema = z.object({
  serviceId: z.number().int().positive("Serviço inválido"),
  barberId: z.number().int().positive("Barbeiro inválido"),
  scheduledAt: z.string().datetime("Data/hora inválida"),
  customerName: z.string().min(1, "Nome do cliente é obrigatório").max(100),
  customerEmail: z.string().email("E-mail inválido").optional().nullable(),
  customerPhone: z.string().max(20).optional().nullable(),
});

export const bookingUpdateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;
