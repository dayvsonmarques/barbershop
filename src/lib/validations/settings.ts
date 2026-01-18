import { z } from "zod";

export const openingHoursSchema = z.object({
  monday: z.string().min(1, "Horário de segunda é obrigatório"),
  tuesday: z.string().min(1, "Horário de terça é obrigatório"),
  wednesday: z.string().min(1, "Horário de quarta é obrigatório"),
  thursday: z.string().min(1, "Horário de quinta é obrigatório"),
  friday: z.string().min(1, "Horário de sexta é obrigatório"),
  saturday: z.string().min(1, "Horário de sábado é obrigatório"),
  sunday: z.string().min(1, "Horário de domingo é obrigatório"),
});

export const establishmentSettingsSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  openingHours: openingHoursSchema,
  address: z.string().min(1, "Endereço é obrigatório"),
  latitude: z.number().finite(),
  longitude: z.number().finite(),
  instagramUrl: z.string().url().optional().nullable(),
  instagramUsername: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

export type EstablishmentSettingsInput = z.infer<typeof establishmentSettingsSchema>;
