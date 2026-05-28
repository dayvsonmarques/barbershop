import { z } from "zod";

export const productCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  description: z.string().max(500).optional().nullable(),
});

export const productImageSchema = z.object({
  url: z.string().min(1, "URL obrigatória"),
  position: z.number().int().min(0),
  isPrimary: z.boolean(),
});

export const productSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório").max(100),
    slug: z
      .string()
      .min(1, "Slug obrigatório")
      .max(120)
      .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
    description: z.string().max(5000).optional().nullable(),
    categoryId: z.number().int().positive("Categoria inválida"),
    price: z.number().min(0.01, "Preço deve ser positivo"),
    discountPrice: z.number().min(0.01).optional().nullable(),
    stock: z.number().int().min(0, "Estoque não pode ser negativo").default(0),
    isActive: z.boolean().default(true),
    images: z.array(productImageSchema).default([]),
  })
  .refine(
    (d) => d.discountPrice == null || d.discountPrice < d.price,
    { message: "Preço com desconto deve ser menor que o preço original", path: ["discountPrice"] }
  );

export const courseSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(200),
  description: z.string().min(1, "Descrição é obrigatória").optional(),
  type: z.enum(["PRESENCIAL", "ONLINE"]),
  durationHours: z.number().int().min(1, "Duração mínima: 1 hora").max(1000),
  price: z.number().min(0, "Preço deve ser positivo"),
  isActive: z.boolean().default(true),
});

export type ProductCategoryInput = z.infer<typeof productCategorySchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
