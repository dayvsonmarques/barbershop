import { z } from "zod";

export const checkoutItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100),
  customerPhone: z.string().min(8, "Telefone inválido").max(20),
  items: z.array(checkoutItemSchema).min(1, "Carrinho vazio"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;
