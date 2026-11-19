import { describe, expect, it } from "vitest";
import { detectBrand, isValidExpiry, luhnCheck, formatCardNumber } from "@/lib/card";

describe("cartão simulado", () => {
  it("valida Luhn", () => {
    expect(luhnCheck("4111 1111 1111 1111")).toBe(true);
    expect(luhnCheck("4000 0000 0000 0002")).toBe(true);
    expect(luhnCheck("4111 1111 1111 1112")).toBe(false);
    expect(luhnCheck("123")).toBe(false);
  });
  it("detecta bandeiras", () => {
    expect(detectBrand("4111111111111111")).toBe("visa");
    expect(detectBrand("5555555555554444")).toBe("mastercard");
    expect(detectBrand("378282246310005")).toBe("amex");
    expect(detectBrand("6362970000457013")).toBe("elo");
  });
  it("valida validade MM/AA", () => {
    const now = new Date(2026, 10, 18);
    expect(isValidExpiry("11/26", now)).toBe(true);
    expect(isValidExpiry("10/26", now)).toBe(false);
    expect(isValidExpiry("13/30", now)).toBe(false);
    expect(isValidExpiry("1/30", now)).toBe(false);
  });
  it("formata número", () => {
    expect(formatCardNumber("4111111111111111")).toBe("4111 1111 1111 1111");
  });
});
