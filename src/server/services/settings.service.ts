import "server-only";
import type { z } from "zod";
import type { settingsSchema, bannerSchema } from "@/lib/validators/admin";
import type { StoreSettings } from "@/generated/prisma/client";
import { prisma } from "../db";

const SETTINGS_ID = "store";
const TTL_MS = 30_000;
let cached: { value: StoreSettings; expiresAt: number } | null = null;

/**
 * Configurações da loja com cache em memória de 30s (lidas em todo layout).
 * O cache é invalidado imediatamente após uma atualização no admin.
 */
export async function getSettings(): Promise<StoreSettings> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const value = await prisma.storeSettings.upsert({ where: { id: SETTINGS_ID }, update: {}, create: { id: SETTINGS_ID } });
  cached = { value, expiresAt: Date.now() + TTL_MS };
  return value;
}

export async function updateSettings(input: z.output<typeof settingsSchema>) {
  const value = await prisma.storeSettings.upsert({
    where: { id: SETTINGS_ID },
    update: input,
    create: { id: SETTINGS_ID, ...input },
  });
  cached = null;
  return value;
}

export function listActiveBanners() {
  return prisma.banner.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
}

export function listBannersAdmin() {
  return prisma.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
}

export function createBanner(input: z.output<typeof bannerSchema>) {
  return prisma.banner.create({ data: input });
}

export function updateBanner(id: string, input: z.output<typeof bannerSchema>) {
  return prisma.banner.update({ where: { id }, data: input });
}

export async function deleteBanner(id: string) {
  await prisma.banner.delete({ where: { id } });
}
