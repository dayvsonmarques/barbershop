import { z } from "zod";

export const barberSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  email: z.string().email("E-mail inválido").optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type BarberInput = z.infer<typeof barberSchema>;
