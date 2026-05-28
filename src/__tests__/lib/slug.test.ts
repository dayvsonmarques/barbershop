import { describe, it, expect } from "vitest";
import { generateSlug } from "@/lib/slug";

describe("generateSlug", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(generateSlug("Pomada Modeladora")).toBe("pomada-modeladora");
  });

  it("strips accents", () => {
    expect(generateSlug("Óleo para Barba")).toBe("oleo-para-barba");
  });

  it("removes special characters", () => {
    expect(generateSlug("Shampoo & Condicionador!")).toBe("shampoo-condicionador");
  });

  it("collapses multiple hyphens", () => {
    expect(generateSlug("a  --  b")).toBe("a-b");
  });

  it("trims leading/trailing whitespace", () => {
    expect(generateSlug("  pomada  ")).toBe("pomada");
  });
});
