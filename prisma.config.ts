import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Não usa env() (que lança erro se ausente): `prisma generate` não precisa
    // de banco e roda no postinstall/Docker antes de existir um .env.
    // migrate/seed/studio continuam falhando com erro claro se a URL faltar.
    url: process.env.DATABASE_URL ?? "",
  },
});
