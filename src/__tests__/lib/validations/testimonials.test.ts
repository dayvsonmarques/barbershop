import { describe, it, expect } from "vitest";
import { testimonialSchema, reorderSchema } from "@/lib/validations/testimonials";

const valid = {
  author: "João Silva",
  quote: "Excelente barbearia!",
  rating: 5,
  isActive: true,
};

describe("testimonialSchema", () => {
  it("accepts valid testimonial", () => {
    expect(testimonialSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty author", () => {
    expect(testimonialSchema.safeParse({ ...valid, author: "" }).success).toBe(false);
  });

  it("rejects empty quote", () => {
    expect(testimonialSchema.safeParse({ ...valid, quote: "" }).success).toBe(false);
  });

  it("rejects rating below 1", () => {
    expect(testimonialSchema.safeParse({ ...valid, rating: 0 }).success).toBe(false);
  });

  it("rejects rating above 5", () => {
    expect(testimonialSchema.safeParse({ ...valid, rating: 6 }).success).toBe(false);
  });

  it("accepts null avatarUrl", () => {
    expect(testimonialSchema.safeParse({ ...valid, avatarUrl: null }).success).toBe(true);
  });

  it("accepts string avatarUrl (local path)", () => {
    expect(testimonialSchema.safeParse({ ...valid, avatarUrl: "/uploads/testimonials/abc.webp" }).success).toBe(true);
  });

  it("defaults rating to 5 when omitted", () => {
    const result = testimonialSchema.safeParse({ author: "A", quote: "B" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.rating).toBe(5);
  });

  it("defaults isActive to true when omitted", () => {
    const result = testimonialSchema.safeParse({ author: "A", quote: "B" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isActive).toBe(true);
  });
});

describe("reorderSchema", () => {
  it("accepts valid reorder array", () => {
    const data = [{ id: 1, position: 0 }, { id: 2, position: 1 }];
    expect(reorderSchema.safeParse(data).success).toBe(true);
  });

  it("rejects non-integer position", () => {
    const data = [{ id: 1, position: 1.5 }];
    expect(reorderSchema.safeParse(data).success).toBe(false);
  });

  it("rejects negative id", () => {
    const data = [{ id: -1, position: 0 }];
    expect(reorderSchema.safeParse(data).success).toBe(false);
  });

  it("rejects empty array", () => {
    expect(reorderSchema.safeParse([]).success).toBe(false);
  });
});
