import { z } from "zod";

export const productCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  description: z.string().max(500).optional().nullable(),
});

export const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  description: z.string().max(1000).optional().nullable(),
  categoryId: z.number().int().positive("Categoria inválida"),
  price: z.number().min(0, "Preço deve ser positivo"),
  stock: z.number().int().min(0, "Estoque não pode ser negativo").default(0),
  isActive: z.boolean().default(true),
});

export const courseSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200),
  description: z.string().min(1, "Descrição é obrigatória"),
  type: z.enum(["PRESENCIAL", "ONLINE"]),
  duration: z.number().int().min(1, "Duração mínima: 1 hora").max(1000),
  price: z.number().min(0, "Preço deve ser positivo"),
  maxStudents: z.number().int().min(1, "Mínimo 1 aluno").max(100),
  status: z.enum(["ATIVO", "INATIVO"]).default("ATIVO"),
});

export type ProductCategoryInput = z.infer<typeof productCategorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
