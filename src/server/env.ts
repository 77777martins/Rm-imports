import "server-only";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória."),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET deve ter ao menos 32 caracteres."),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(1).max(120).default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  APP_URL: z.url().default("http://localhost:3000"),
  DEMO_SHOW_RESET_LINK: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // Falha cedo e de forma explícita, sem vazar valores.
  const fields = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Variáveis de ambiente inválidas:\n${fields}`);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
