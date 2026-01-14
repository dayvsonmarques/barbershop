import { z } from "zod";

export const serviceCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  description: z.string().max(500).optional().nullable(),
});

export const serviceSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  description: z.string().max(1000).optional().nullable(),
  duration: z.number().int().min(5, "Duração mínima: 5 minutos").max(480),
  price: z.number().min(0, "Preço deve ser positivo"),
  categoryId: z.number().int().positive("Categoria inválida"),
  isActive: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
