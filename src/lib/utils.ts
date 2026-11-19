import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Concatena classes Tailwind resolvendo conflitos. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata centavos como moeda brasileira. */
export function formatCents(cents: number): string {
  return currency.format(cents / 100);
}

export function formatDate(value: string | Date, withTime = false): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    ...(withTime ? { timeStyle: "short" } : {}),
  }).format(date);
}

/** Gera slug ASCII seguro para URLs. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 170);
}

/** Converte "R$ 12,34" / "12,34" / "12.34" para centavos. */
export function parseMoneyToCents(value: string | number): number {
  if (typeof value === "number") return Math.round(value * 100);
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : NaN;
}

export function discountPercent(priceCents: number, salePriceCents: number | null | undefined): number {
  if (!salePriceCents || salePriceCents >= priceCents) return 0;
  return Math.round((1 - salePriceCents / priceCents) * 100);
}

export function effectivePrice(p: { priceCents: number; salePriceCents: number | null }): number {
  return p.salePriceCents && p.salePriceCents < p.priceCents ? p.salePriceCents : p.priceCents;
}

/**
 * Garante que um destino de redirecionamento seja um caminho interno,
 * prevenindo Open Redirect (ex.: "//evil.com" ou "https://evil.com").
 */
export function safeInternalPath(path: string | null | undefined, fallback = "/"): string {
  if (!path || typeof path !== "string") return fallback;
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  return path;
}
