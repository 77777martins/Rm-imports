import { test as base, expect, type Page } from "@playwright/test";

export const ACCOUNTS = {
  admin: { email: "admin@medfacil.demo", password: "Admin@12345" },
  customer: { email: "cliente@medfacil.demo", password: "Cliente@123" },
} as const;

/** Produtos do seed com estoque alto — resistem a várias execuções seguidas. */
export const PRODUCTS = {
  highStockA: { slug: "soro-fisiologico-0-9", name: "Soro Fisiológico 0,9%" },
  highStockB: { slug: "alcool-gel-70", name: "Álcool Gel 70%" },
  highStockC: { slug: "sorriso-pro-creme-dental", name: "Sorriso Pro Creme Dental" },
} as const;

/** Erros esperados (ex.: 402 do cartão recusado de propósito). */
// 401: sessão expirada tratada pelo interceptor · 402: cartão recusado · 404: página inexistente · 409: regra de negócio
const EXPECTED_CONSOLE = [/status of 40[1249]/];

type Fixtures = { pageErrors: string[] };

/**
 * `page` instrumentada: qualquer exceção JS ou erro de console inesperado
 * reprova o teste — garante que a UI não quebra silenciosamente.
 */
export const test = base.extend<Fixtures>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() === "error" && !EXPECTED_CONSOLE.some((r) => r.test(m.text()))) errors.push(`console: ${m.text()}`);
      });
      await use(errors);
      expect(errors, "A página não deve emitir erros de JavaScript").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Login via API (rápido): os cookies httpOnly ficam no contexto do navegador. */
export async function loginAs(page: Page, who: keyof typeof ACCOUNTS) {
  const baseURL = test.info().project.use.baseURL!;
  const res = await page.context().request.post("/api/auth/login", {
    data: ACCOUNTS[who],
    headers: { origin: new URL(baseURL).origin },
  });
  expect(res.ok(), `login de ${who} deve funcionar`).toBeTruthy();
}

export function uniqueSuffix() {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`.toUpperCase();
}
