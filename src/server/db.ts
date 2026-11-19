import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env, isProduction } from "./env";

// Singleton: evita múltiplas conexões durante o hot reload em desenvolvimento.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter, log: isProduction ? ["error"] : ["error", "warn"] });
}

export const prisma = globalForPrisma.prisma ?? createClient();
if (!isProduction) globalForPrisma.prisma = prisma;
