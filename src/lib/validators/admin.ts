import { z } from "zod";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import type { OrderStatus } from "@/generated/prisma/enums";
import { cleanText, hexColorSchema, idSchema, imageUrlSchema, internalHrefSchema, optionalText, emailSchema } from "./common";

const cents = (label: string) =>
  z.coerce.number({ error: `${label} inválido.` }).int(`${label} inválido.`).min(0, `${label} não pode ser negativo.`).max(10_000_000);

export const productSchema = z
  .object({
    name: cleanText(3, 160, "Nome"),
    sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,32}$/, "Código deve conter letras, números ou hífen (3–32)."),
    brand: cleanText(2, 80, "Marca"),
    description: cleanText(10, 4000, "Descrição"),
    categoryId: idSchema,
    priceCents: cents("Preço").refine((v) => v > 0, "Preço deve ser maior que zero."),
    salePriceCents: cents("Preço promocional").nullable().optional().transform((v) => (v ? v : null)),
    stock: z.coerce.number().int().min(0, "Estoque não pode ser negativo.").max(1_000_000),
    imageUrl: imageUrlSchema,
    packaging: z.enum(["BOX", "BOTTLE", "TUBE", "BLISTER", "JAR", "SPRAY"]),
    accentColor: hexColorSchema,
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    technicalInfo: z
      .array(z.object({ label: cleanText(1, 60, "Rótulo"), value: cleanText(1, 200, "Valor") }))
      .max(20),
  })
  .refine((d) => d.salePriceCents === null || d.salePriceCents < d.priceCents, {
    path: ["salePriceCents"],
    message: "O preço promocional deve ser menor que o preço normal.",
  });
export type ProductInput = z.input<typeof productSchema>;

/** Atualização parcial rápida (preço/estoque/ativo) direto da listagem. */
export const productQuickUpdateSchema = z
  .object({
    priceCents: cents("Preço").refine((v) => v > 0, "Preço deve ser maior que zero.").optional(),
    salePriceCents: cents("Preço promocional").nullable().optional(),
    stock: z.coerce.number().int().min(0).max(1_000_000).optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, "Nada para atualizar.");

export const categorySchema = z.object({
  name: cleanText(2, 80, "Nome"),
  description: optionalText(255, "Descrição"),
  icon: z.string().trim().regex(/^[a-z-]{2,40}$/, "Ícone inválido.").default("pill"),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
});
export type CategoryInput = z.input<typeof categorySchema>;

const statuses = Object.keys(ORDER_STATUS_LABEL) as [OrderStatus, ...OrderStatus[]];
export const orderStatusUpdateSchema = z.object({
  status: z.enum(statuses),
  note: optionalText(255, "Observação"),
});

export const settingsSchema = z.object({
  storeName: cleanText(2, 60, "Nome da loja"),
  tagline: cleanText(2, 120, "Slogan"),
  logoUrl: imageUrlSchema,
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  contactEmail: emailSchema,
  contactPhone: cleanText(8, 20, "Telefone"),
  whatsapp: z.string().trim().regex(/^\d{12,13}$/, "WhatsApp com DDI+DDD, só números. Ex.: 5511912345678"),
  address: cleanText(5, 200, "Endereço"),
  freeShippingMinCents: cents("Frete grátis a partir de"),
});
export type SettingsInput = z.input<typeof settingsSchema>;

export const bannerSchema = z.object({
  title: cleanText(3, 100, "Título"),
  subtitle: optionalText(200, "Subtítulo"),
  ctaLabel: optionalText(40, "Texto do botão"),
  ctaHref: internalHrefSchema,
  imageUrl: imageUrlSchema,
  colorFrom: hexColorSchema,
  colorTo: hexColorSchema,
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(1000),
});
export type BannerInput = z.input<typeof bannerSchema>;

export const couponSchema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Use 3–30 letras, números, _ ou -."),
    description: optionalText(160, "Descrição"),
    type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
    value: z.coerce.number().int().min(0).max(10_000_000),
    minSubtotalCents: cents("Pedido mínimo"),
    maxUses: z.coerce.number().int().min(1).max(1_000_000).nullable().optional().transform((v) => v ?? null),
    expiresAt: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (v ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T23:59:59.999-03:00` : v) : null))
      .refine((d) => d === null || !Number.isNaN(d.getTime()), "Data inválida."),
    isActive: z.boolean(),
  })
  .refine((d) => d.type !== "PERCENT" || (d.value >= 1 && d.value <= 100), {
    path: ["value"],
    message: "Percentual deve ficar entre 1 e 100.",
  })
  .refine((d) => d.type !== "FIXED" || d.value > 0, { path: ["value"], message: "Informe o valor do desconto." });
export type CouponInput = z.input<typeof couponSchema>;
