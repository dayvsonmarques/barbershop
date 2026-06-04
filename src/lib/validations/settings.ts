import { z } from "zod";

export const establishmentSettingsSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  openingHours: z.string().min(1, "Horário de funcionamento é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  latitude: z.number().finite(),
  longitude: z.number().finite(),
  instagramUrl: z.string().url().optional().nullable(),
  instagramUsername: z.string().optional().nullable(),
  instagramUserId: z.string().optional().nullable(),
  instagramAccessToken: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

export type EstablishmentSettingsInput = z.infer<typeof establishmentSettingsSchema>;
