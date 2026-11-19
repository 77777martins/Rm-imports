/**
 * Utilitários do cartão SIMULADO.
 * O número completo do cartão NUNCA sai do navegador: o cliente valida,
 * "tokeniza" (simulação) e envia ao servidor apenas bandeira + últimos 4 dígitos,
 * imitando o fluxo de gateways reais (PCI-DSS).
 */

export type CardBrand = "visa" | "mastercard" | "elo" | "amex" | "hipercard" | "desconhecida";

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function luhnCheck(cardNumber: string): boolean {
  const digits = onlyDigits(cardNumber);
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function detectBrand(cardNumber: string): CardBrand {
  const n = onlyDigits(cardNumber);
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(n)) return "elo";
  if (/^(606282|3841)/.test(n)) return "hipercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
  return "desconhecida";
}

/** Valida MM/AA não expirado. */
export function isValidExpiry(expiry: string, now = new Date()): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry.trim());
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  return endOfMonth.getTime() >= now.getTime();
}

export function formatCardNumber(value: string): string {
  return onlyDigits(value).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** Cartões de teste documentados no README. Final 0002 = recusado. */
export const DEMO_CARDS = [
  { label: "Visa aprovado", number: "4111 1111 1111 1111" },
  { label: "Mastercard aprovado", number: "5555 5555 5555 4444" },
  { label: "Recusado (final 0002)", number: "4000 0000 0000 0002" },
] as const;

/**
 * "Tokenização" SIMULADA: gera um identificador aleatório que representa o
 * cartão. Em um gateway real, o SDK do provedor faria isso no navegador.
 */
export function createDemoCardToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `tok_demo_${Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").replace(/[^a-z0-9]/gi, "").slice(0, 32)}`;
}
