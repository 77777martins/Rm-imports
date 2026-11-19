import "server-only";
import type { z } from "zod";
import { type Prisma } from "@/generated/prisma/client";
import type { CatalogQuery } from "@/lib/validators/catalog";
import type { productSchema, productQuickUpdateSchema } from "@/lib/validators/admin";
import { LOW_STOCK_THRESHOLD, PAGE_SIZE } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { prisma } from "../db";
import { Errors } from "../errors";

/** Campos expostos publicamente nos cards — nada além do necessário. */
export const productCardSelect = {
  id: true,
  sku: true,
  name: true,
  slug: true,
  brand: true,
  priceCents: true,
  salePriceCents: true,
  finalPriceCents: true,
  stock: true,
  imageUrl: true,
  packaging: true,
  accentColor: true,
  ratingAvg: true,
  ratingCount: true,
  soldCount: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

const publicWhere: Prisma.ProductWhereInput = { isActive: true, category: { isActive: true } };

const SORT_MAP: Record<CatalogQuery["ordem"], Prisma.ProductOrderByWithRelationInput[]> = {
  relevance: [{ isFeatured: "desc" }, { soldCount: "desc" }, { name: "asc" }],
  "best-sellers": [{ soldCount: "desc" }, { name: "asc" }],
  "price-asc": [{ finalPriceCents: "asc" }, { name: "asc" }],
  "price-desc": [{ finalPriceCents: "desc" }, { name: "asc" }],
  newest: [{ createdAt: "desc" }, { name: "asc" }],
  "name-asc": [{ name: "asc" }],
};

function searchWhere(q?: string): Prisma.ProductWhereInput {
  if (!q) return {};
  const term = q.trim();
  return {
    OR: [
      { name: { contains: term, mode: "insensitive" } },
      { brand: { contains: term, mode: "insensitive" } },
      { sku: { contains: term, mode: "insensitive" } },
      { category: { name: { contains: term, mode: "insensitive" } } },
    ],
  };
}

export async function searchCatalog(query: CatalogQuery) {
  const where: Prisma.ProductWhereInput = {
    AND: [
      publicWhere,
      searchWhere(query.q),
      query.categoria ? { category: { slug: query.categoria } } : {},
      query.promo ? { salePriceCents: { not: null } } : {},
      query.estoque ? { stock: { gt: 0 } } : {},
      query.min !== undefined || query.max !== undefined
        ? {
            finalPriceCents: {
              ...(query.min !== undefined ? { gte: Math.round(query.min * 100) } : {}),
              ...(query.max !== undefined ? { lte: Math.round(query.max * 100) } : {}),
            },
          }
        : {},
    ],
  };
  const [total, items] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: SORT_MAP[query.ordem],
      skip: (query.pagina - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: productCardSelect,
    }),
  ]);
  return { total, page: query.pagina, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)), items };
}

/** Sugestões rápidas para o autocomplete da busca. */
export function suggestProducts(q: string) {
  return prisma.product.findMany({
    where: { AND: [publicWhere, searchWhere(q)] },
    orderBy: [{ soldCount: "desc" }],
    take: 6,
    select: { id: true, name: true, slug: true, finalPriceCents: true, packaging: true, accentColor: true, imageUrl: true, brand: true },
  });
}

export function listShowcase(kind: "featured" | "offers" | "best-sellers", take = 8) {
  const where: Prisma.ProductWhereInput =
    kind === "featured"
      ? { ...publicWhere, isFeatured: true }
      : kind === "offers"
        ? { ...publicWhere, salePriceCents: { not: null } }
        : publicWhere;
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    kind === "offers" ? [{ soldCount: "desc" }] : kind === "featured" ? [{ updatedAt: "desc" }] : [{ soldCount: "desc" }];
  return prisma.product.findMany({ where, orderBy, take, select: productCardSelect });
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, ...publicWhere },
    select: { ...productCardSelect, description: true, technicalInfo: true, categoryId: true },
  });
  if (!product) return null;
  const related = await prisma.product.findMany({
    where: { ...publicWhere, categoryId: product.categoryId, id: { not: product.id } },
    orderBy: { soldCount: "desc" },
    take: 4,
    select: productCardSelect,
  });
  return { product, related };
}

// ------------------------------- ADMIN -------------------------------------

export async function listProductsAdmin(params: {
  page: number;
  pageSize: number;
  q?: string;
  categoryId?: string;
  status?: "active" | "inactive" | "low-stock" | "out-of-stock";
}) {
  const statusWhere: Record<string, Prisma.ProductWhereInput> = {
    active: { isActive: true },
    inactive: { isActive: false },
    "low-stock": { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } },
    "out-of-stock": { stock: 0 },
  };
  const where: Prisma.ProductWhereInput = {
    AND: [searchWhere(params.q), params.categoryId ? { categoryId: params.categoryId } : {}, params.status ? statusWhere[params.status] : {}],
  };
  const [total, items] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: { ...productCardSelect, isActive: true, isFeatured: true, updatedAt: true },
    }),
  ]);
  return { total, page: params.page, pageSize: params.pageSize, items };
}

export async function getProductAdmin(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw Errors.notFound("Produto não encontrado.");
  return product;
}

function finalPrice(priceCents: number, salePriceCents: number | null) {
  return salePriceCents && salePriceCents < priceCents ? salePriceCents : priceCents;
}

async function uniqueSlug(name: string, ignoreId?: string): Promise<string> {
  const base = slugify(name) || "produto";
  let slug = base;
  for (let i = 2; ; i++) {
    const found = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!found || found.id === ignoreId) return slug;
    slug = `${base}-${i}`;
  }
}

async function ensureCategory(categoryId: string) {
  const exists = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!exists) throw Errors.badRequest("Categoria inexistente.");
}

export async function createProduct(input: z.output<typeof productSchema>) {
  await ensureCategory(input.categoryId);
  return prisma.product.create({
    data: {
      ...input,
      slug: await uniqueSlug(input.name),
      finalPriceCents: finalPrice(input.priceCents, input.salePriceCents),
      technicalInfo: input.technicalInfo,
    },
  });
}

export async function updateProduct(id: string, input: z.output<typeof productSchema>) {
  const current = await getProductAdmin(id);
  await ensureCategory(input.categoryId);
  return prisma.product.update({
    where: { id },
    data: {
      ...input,
      slug: current.name === input.name ? current.slug : await uniqueSlug(input.name, id),
      finalPriceCents: finalPrice(input.priceCents, input.salePriceCents),
      technicalInfo: input.technicalInfo,
    },
  });
}

export async function quickUpdateProduct(id: string, input: z.output<typeof productQuickUpdateSchema>) {
  const current = await getProductAdmin(id);
  const priceCents = input.priceCents ?? current.priceCents;
  const salePriceCents = input.salePriceCents === undefined ? current.salePriceCents : input.salePriceCents;
  if (salePriceCents !== null && salePriceCents >= priceCents)
    throw Errors.badRequest("O preço promocional deve ser menor que o preço normal.");
  return prisma.product.update({
    where: { id },
    data: { ...input, salePriceCents, finalPriceCents: finalPrice(priceCents, salePriceCents) },
    select: { ...productCardSelect, isActive: true, isFeatured: true, updatedAt: true },
  });
}

/** Exclusão definitiva só é permitida se o produto nunca foi vendido (preserva histórico). */
export async function deleteProduct(id: string) {
  const sold = await prisma.orderItem.count({ where: { productId: id } });
  if (sold > 0)
    throw Errors.conflict("Este produto possui pedidos vinculados e não pode ser excluído. Desative-o para ocultá-lo da loja.");
  await prisma.product.delete({ where: { id } });
}
