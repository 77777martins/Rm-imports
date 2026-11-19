/**
 * Regras de precificação PURAS (sem I/O) — compartilhadas entre
 * cliente e servidor. O servidor é sempre a fonte da verdade:
 * os valores calculados no cliente servem apenas para exibição.
 */

export interface ShippingQuote {
  zone: string;
  cents: number;
  days: number;
}

/** Tabela de frete FICTÍCIA baseada no 1º dígito do CEP. */
const SHIPPING_ZONES: Record<string, { zone: string; cents: number; days: number }> = {
  "0": { zone: "Grande São Paulo", cents: 990, days: 2 },
  "1": { zone: "Interior de SP", cents: 1290, days: 3 },
  "2": { zone: "RJ / ES", cents: 1490, days: 4 },
  "3": { zone: "Minas Gerais", cents: 1490, days: 4 },
  "4": { zone: "BA / SE", cents: 2190, days: 6 },
  "5": { zone: "PE / AL / PB / RN", cents: 2290, days: 7 },
  "6": { zone: "Norte / CE / PI / MA", cents: 2990, days: 9 },
  "7": { zone: "Centro-Oeste / TO / RO", cents: 2290, days: 6 },
  "8": { zone: "PR / SC", cents: 1790, days: 5 },
  "9": { zone: "Rio Grande do Sul", cents: 1890, days: 5 },
};

export function normalizeZip(zip: string): string {
  return zip.replace(/\D/g, "");
}

export function isValidZip(zip: string): boolean {
  return /^\d{8}$/.test(normalizeZip(zip));
}

export function quoteShipping(zip: string): ShippingQuote | null {
  const digits = normalizeZip(zip);
  if (!/^\d{8}$/.test(digits)) return null;
  return SHIPPING_ZONES[digits[0]] ?? null;
}

export interface CouponRule {
  code: string;
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minSubtotalCents: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  isActive: boolean;
}

export type CouponCheck = { ok: true } | { ok: false; reason: string };

export function checkCoupon(coupon: CouponRule, subtotalCents: number, now = new Date()): CouponCheck {
  if (!coupon.isActive) return { ok: false, reason: "Cupom inativo." };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) return { ok: false, reason: "Cupom expirado." };
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
    return { ok: false, reason: "Cupom esgotado." };
  if (subtotalCents < coupon.minSubtotalCents)
    return {
      ok: false,
      reason: `Pedido mínimo de ${(coupon.minSubtotalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} para este cupom.`,
    };
  return { ok: true };
}

export function couponDiscount(coupon: Pick<CouponRule, "type" | "value">, subtotalCents: number): number {
  switch (coupon.type) {
    case "PERCENT":
      return Math.min(subtotalCents, Math.round((subtotalCents * Math.min(Math.max(coupon.value, 0), 100)) / 100));
    case "FIXED":
      return Math.min(subtotalCents, Math.max(coupon.value, 0));
    default:
      return 0;
  }
}

export interface TotalsInput {
  subtotalCents: number;
  zip?: string | null;
  coupon?: Pick<CouponRule, "type" | "value"> | null;
  freeShippingMinCents: number;
}

export interface Totals {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number | null;
  shippingDays: number | null;
  shippingZone: string | null;
  freeShipping: boolean;
  totalCents: number;
}

export function computeTotals({ subtotalCents, zip, coupon, freeShippingMinCents }: TotalsInput): Totals {
  const discountCents = coupon ? couponDiscount(coupon, subtotalCents) : 0;
  const afterDiscount = subtotalCents - discountCents;
  const quote = zip ? quoteShipping(zip) : null;
  const freeShipping =
    subtotalCents > 0 && (coupon?.type === "FREE_SHIPPING" || afterDiscount >= freeShippingMinCents);
  const shippingCents = quote ? (freeShipping ? 0 : quote.cents) : null;
  return {
    subtotalCents,
    discountCents,
    shippingCents,
    shippingDays: quote?.days ?? null,
    shippingZone: quote?.zone ?? null,
    freeShipping,
    totalCents: afterDiscount + (shippingCents ?? 0),
  };
}

/** Parcelamento fictício sem juros com parcela mínima de R$ 20,00. */
export function maxInstallmentsFor(totalCents: number, max = 6, minInstallmentCents = 2000): number {
  return Math.max(1, Math.min(max, Math.floor(totalCents / minInstallmentCents)));
}
