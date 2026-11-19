import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * HSTS e `upgrade-insecure-requests` só fazem sentido quando o site é servido
 * via HTTPS. Ficam ativos em produção, exceto se APP_URL for explicitamente
 * http:// (produção local, CI ou VPS antes do certificado) — nesse caso
 * converteriam redirecionamentos internos para https e quebrariam a navegação.
 */
const enforceHttps = !isDev && !(process.env.APP_URL ?? "").startsWith("http://");

/**
 * Content-Security-Policy.
 * Trade-off: 'unsafe-inline' em script-src é necessário para os scripts de
 * hidratação do Next sem nonce. Usar nonce exigiria renderização dinâmica de
 * todas as páginas; para este projeto optamos por CSP estática + demais camadas
 * (React escapa saída, nenhuma injeção de HTML bruto, validação Zod).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(enforceHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(enforceHttps ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
