import { defineConfig, devices } from "@playwright/test";

/**
 * Testes E2E (navegador real contra app + banco reais).
 * Local:  npm run db:seed && npm run test:e2e   (sobe o `next dev` automaticamente)
 * CI:     o workflow builda e inicia `next start`; E2E_BASE_URL aponta para ele.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  // Os testes compartilham o mesmo banco (estoque, pedidos): execução serial é determinística.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: isCI ? "retain-on-failure" : "off",
    screenshot: "only-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } }, testIgnore: /mobile\.spec/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: `${baseURL}/api/health`,
        reuseExistingServer: true,
        timeout: 120_000,
        env: { RATE_LIMIT_MULTIPLIER: "50" },
      },
});
