import { describe, it, expect } from "vitest";
import { productSchema } from "@/lib/validations/products-courses";

describe("productSchema", () => {
  const valid = {
    name: "Pomada Forte",
    slug: "pomada-forte",
    categoryId: 1,
    price: 45.0,
    stock: 10,
    isActive: true,
    images: [{ url: "/uploads/products/abc.webp", position: 0, isPrimary: true }],
  };

  it("accepts valid product", () => {
    expect(productSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects slug with uppercase", () => {
    expect(productSchema.safeParse({ ...valid, slug: "Pomada-Forte" }).success).toBe(false);
  });

  it("rejects negative price", () => {
    expect(productSchema.safeParse({ ...valid, price: -1 }).success).toBe(false);
  });

  it("accepts null discountPrice", () => {
    expect(productSchema.safeParse({ ...valid, discountPrice: null }).success).toBe(true);
  });

  it("rejects discountPrice higher than price", () => {
    const result = productSchema.safeParse({ ...valid, discountPrice: 50.0 });
    expect(result.success).toBe(false);
  });

  it("defaults images to empty array", () => {
    const result = productSchema.safeParse({ ...valid, images: undefined });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.images).toEqual([]);
  });

  it("rejects empty slug", () => {
    expect(productSchema.safeParse({ ...valid, slug: "" }).success).toBe(false);
  });
});
