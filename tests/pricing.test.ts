import { describe, expect, it } from "vitest";
import { checkCoupon, computeTotals, couponDiscount, maxInstallmentsFor, quoteShipping } from "@/lib/pricing";

const baseCoupon = { code: "X", type: "PERCENT" as const, value: 10, minSubtotalCents: 0, maxUses: null, usedCount: 0, expiresAt: null, isActive: true };

describe("quoteShipping", () => {
  it("cota por região a partir do 1º dígito do CEP", () => {
    expect(quoteShipping("01310-100")).toMatchObject({ cents: 990, days: 2 });
    expect(quoteShipping("90010150")).toMatchObject({ cents: 1890 });
  });
  it("rejeita CEP inválido", () => {
    expect(quoteShipping("123")).toBeNull();
    expect(quoteShipping("abcde-fgh")).toBeNull();
  });
});

describe("cupons", () => {
  it("calcula percentual e valor fixo sem ultrapassar o subtotal", () => {
    expect(couponDiscount({ type: "PERCENT", value: 10 }, 10_000)).toBe(1_000);
    expect(couponDiscount({ type: "FIXED", value: 5_000 }, 3_000)).toBe(3_000);
    expect(couponDiscount({ type: "FREE_SHIPPING", value: 0 }, 3_000)).toBe(0);
  });
  it("valida expiração, limite de uso, mínimo e status", () => {
    expect(checkCoupon({ ...baseCoupon, isActive: false }, 100).ok).toBe(false);
    expect(checkCoupon({ ...baseCoupon, expiresAt: new Date(Date.now() - 1000) }, 100).ok).toBe(false);
    expect(checkCoupon({ ...baseCoupon, maxUses: 3, usedCount: 3 }, 100).ok).toBe(false);
    expect(checkCoupon({ ...baseCoupon, minSubtotalCents: 12_000 }, 11_999).ok).toBe(false);
    expect(checkCoupon(baseCoupon, 100).ok).toBe(true);
  });
});

describe("computeTotals", () => {
  it("aplica desconto e frete", () => {
    const t = computeTotals({ subtotalCents: 10_000, zip: "01310100", coupon: { type: "PERCENT", value: 10 }, freeShippingMinCents: 19_900 });
    expect(t).toMatchObject({ discountCents: 1_000, shippingCents: 990, totalCents: 9_990, freeShipping: false });
  });
  it("frete grátis acima do mínimo (após desconto) ou por cupom", () => {
    expect(computeTotals({ subtotalCents: 20_000, zip: "01310100", freeShippingMinCents: 19_900 }).shippingCents).toBe(0);
    expect(computeTotals({ subtotalCents: 20_000, zip: "01310100", coupon: { type: "FIXED", value: 500 }, freeShippingMinCents: 19_900 }).shippingCents).toBe(990);
    expect(computeTotals({ subtotalCents: 1_000, zip: "01310100", coupon: { type: "FREE_SHIPPING", value: 0 }, freeShippingMinCents: 19_900 }).shippingCents).toBe(0);
  });
  it("sem CEP não soma frete", () => {
    expect(computeTotals({ subtotalCents: 5_000, freeShippingMinCents: 19_900 })).toMatchObject({ shippingCents: null, totalCents: 5_000 });
  });
});

describe("parcelamento", () => {
  it("respeita parcela mínima de R$ 20", () => {
    expect(maxInstallmentsFor(1_500)).toBe(1);
    expect(maxInstallmentsFor(6_000)).toBe(3);
    expect(maxInstallmentsFor(100_000)).toBe(6);
  });
});
