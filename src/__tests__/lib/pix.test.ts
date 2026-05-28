import { describe, it, expect } from "vitest";
import { generatePixCode } from "@/lib/pix";

describe("generatePixCode", () => {
  it("returns a non-empty string", () => {
    const code = generatePixCode({ pixKey: "test@email.com", amount: 10.5, merchantName: "Barbeiro", merchantCity: "Recife", txId: "TX001" });
    expect(typeof code).toBe("string");
    expect(code.length).toBeGreaterThan(0);
  });

  it("contains the PIX key in the payload", () => {
    const pixKey = "11999990000";
    const code = generatePixCode({ pixKey, amount: 25.0, merchantName: "Barbeiro", merchantCity: "Recife", txId: "TX002" });
    expect(code).toContain(pixKey);
  });

  it("contains the merchant name in the payload", () => {
    const merchantName = "ED Barbearia";
    const code = generatePixCode({ pixKey: "chave@pix.com", amount: 50.0, merchantName, merchantCity: "Recife", txId: "TX003" });
    expect(code).toContain(merchantName);
  });

  it("contains the merchant city in the payload", () => {
    const merchantCity = "Recife";
    const code = generatePixCode({ pixKey: "chave@pix.com", amount: 50.0, merchantName: "Barbeiro", merchantCity, txId: "TX004" });
    expect(code).toContain(merchantCity);
  });

  it("ends with a 4-character CRC16 hex checksum", () => {
    const code = generatePixCode({ pixKey: "chave@pix.com", amount: 99.99, merchantName: "Barbeiro", merchantCity: "SP", txId: "TX005" });
    expect(code).toMatch(/[0-9A-F]{4}$/);
  });

  it("encodes the amount with 2 decimal places", () => {
    const code = generatePixCode({ pixKey: "chave@pix.com", amount: 1.5, merchantName: "Barbeiro", merchantCity: "Recife", txId: "TX006" });
    expect(code).toContain("1.50");
  });
});
