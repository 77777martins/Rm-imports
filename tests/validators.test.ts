import { describe, expect, it } from "vitest";
import { registerSchema } from "@/lib/validators/auth";
import { checkoutSchema } from "@/lib/validators/checkout";
import { productSchema, bannerSchema } from "@/lib/validators/admin";
import { catalogQuerySchema } from "@/lib/validators/catalog";
import { safeInternalPath } from "@/lib/utils";

describe("validators", () => {
  it("exige senha forte e confirmação", () => {
    const base = { name: "Fulano Teste", email: "A@B.COM ", password: "Senha123", confirmPassword: "Senha123", acceptTerms: true };
    const ok = registerSchema.safeParse(base);
    expect(ok.success && ok.data.email).toBe("a@b.com");
    expect(registerSchema.safeParse({ ...base, password: "fraca", confirmPassword: "fraca" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, confirmPassword: "Outra123" }).success).toBe(false);
  });

  it("checkout de cartão rejeita número completo (só aceita token)", () => {
    const base = {
      items: [{ productId: "abc123", quantity: 1 }],
      recipientName: "Fulano",
      address: { zipCode: "01310-100", street: "Av. Paulista", number: "100", district: "Bela Vista", city: "São Paulo", state: "SP" },
    };
    expect(checkoutSchema.safeParse({ ...base, payment: { method: "PIX" } }).success).toBe(true);
    expect(
      checkoutSchema.safeParse({ ...base, payment: { method: "CARD", holderName: "FULANO", brand: "visa", last4: "1111", token: "4111111111111111", installments: 1 } }).success,
    ).toBe(false);
  });

  it("remove caracteres de controle de textos", () => {
    const r = productSchema.safeParse({
      name: "Produto\u0000 Teste", sku: "ab-1", brand: "Marca", description: "Descrição longa o bastante",
      categoryId: "cat1", priceCents: 1000, salePriceCents: 900, stock: 1, imageUrl: "", packaging: "BOX",
      accentColor: "#000000", isActive: true, isFeatured: false, technicalInfo: [],
    });
    expect(r.success && r.data.name).toBe("Produto Teste");
    expect(r.success && r.data.sku).toBe("AB-1");
  });

  it("bloqueia URLs perigosas em banners", () => {
    const base = { title: "Banner", colorFrom: "#000000", colorTo: "#ffffff", isActive: true, sortOrder: 0 };
    expect(bannerSchema.safeParse({ ...base, ctaHref: "javascript:alert(1)" }).success).toBe(false);
    expect(bannerSchema.safeParse({ ...base, ctaHref: "//evil.com" }).success).toBe(false);
    expect(bannerSchema.safeParse({ ...base, imageUrl: "http://inseguro.com/a.png" }).success).toBe(false);
    expect(bannerSchema.safeParse({ ...base, ctaHref: "/produtos" }).success).toBe(true);
  });

  it("filtros inválidos do catálogo caem para o padrão", () => {
    const r = catalogQuerySchema.parse({ ordem: "DROP TABLE", pagina: "-5", categoria: "<script>" });
    expect(r).toMatchObject({ ordem: "relevance", pagina: 1, categoria: undefined });
  });

  it("previne open redirect", () => {
    expect(safeInternalPath("/conta")).toBe("/conta");
    expect(safeInternalPath("//evil.com")).toBe("/");
    expect(safeInternalPath("https://evil.com")).toBe("/");
    expect(safeInternalPath("/\\evil.com")).toBe("/");
  });
});
