import { z } from "zod";

export const testimonialSchema = z.object({
  author: z.string().min(1, "Autor é obrigatório").max(100),
  quote: z.string().min(1, "Depoimento é obrigatório").max(2000),
  avatarUrl: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5).default(5),
  position: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const reorderSchema = z
  .array(
    z.object({
      id: z.number().int().positive(),
      position: z.number().int().min(0),
    })
  )
  .min(1);

export type TestimonialInput = z.infer<typeof testimonialSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
