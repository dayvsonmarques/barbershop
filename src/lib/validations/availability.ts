import { z } from "zod";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato inválido (HH:MM)");

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)");

export const recurrenceTypeSchema = z.enum(["DAILY", "WEEKLY", "MONTHLY"]);
export const dayOfWeekSchema = z.enum([
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
]);

export const availabilityRuleSchema = z
  .object({
    barberId: z.number().int().positive(),
    serviceId: z.number().int().positive().nullable().optional(),
    recurrenceType: recurrenceTypeSchema,
    dayOfWeek: dayOfWeekSchema.nullable().optional(),
    dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
    startTime: timeSchema,
    endTime: timeSchema,
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.recurrenceType === "WEEKLY" && !data.dayOfWeek) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dayOfWeek"],
        message: "dayOfWeek é obrigatório para recorrência semanal",
      });
    }

    if (data.recurrenceType === "MONTHLY" && !data.dayOfMonth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dayOfMonth"],
        message: "dayOfMonth é obrigatório para recorrência mensal",
      });
    }
  });

export const availabilityExceptionSchema = z
  .object({
    barberId: z.number().int().positive(),
    date: dateSchema,
    type: z.enum(["BLOCKED", "SPECIAL"]),
    startTime: timeSchema.nullable().optional(),
    endTime: timeSchema.nullable().optional(),
    reason: z.string().max(255).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "SPECIAL") {
      if (!data.startTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["startTime"],
          message: "startTime é obrigatório para SPECIAL",
        });
      }
      if (!data.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endTime"],
          message: "endTime é obrigatório para SPECIAL",
        });
      }
    }
  });
