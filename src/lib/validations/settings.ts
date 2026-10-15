import { z } from "zod";

export const establishmentSettingsSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  openingHours: z.string().min(1, "Horário de funcionamento é obrigatório"),
  address: z.string().default(""),
  latitude: z.number().finite(),
  longitude: z.number().finite(),
  instagramUsername: z.string().optional().nullable(),
  instagramUserId: z.string().optional().nullable(),
  instagramAccessToken: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  pixKey: z.string().optional().nullable(),
  googleReviewUrl: z.string().url("Link de avaliação inválido").optional().nullable(),
});

export type EstablishmentSettingsInput = z.infer<typeof establishmentSettingsSchema>;
