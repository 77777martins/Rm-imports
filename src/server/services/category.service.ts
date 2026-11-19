import "server-only";
import type { z } from "zod";
import type { categorySchema } from "@/lib/validators/admin";
import { slugify } from "@/lib/utils";
import { prisma } from "../db";
import { Errors } from "../errors";

export function listActiveCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, icon: true, description: true },
  });
}

export async function listCategoriesAdmin() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  return categories.map(({ _count, ...c }) => ({ ...c, productsCount: _count.products }));
}

export async function createCategory(input: z.output<typeof categorySchema>) {
  return prisma.category.create({ data: { ...input, slug: slugify(input.name) } });
}

export async function updateCategory(id: string, input: z.output<typeof categorySchema>) {
  return prisma.category.update({ where: { id }, data: { ...input, slug: slugify(input.name) } });
}

export async function deleteCategory(id: string) {
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0)
    throw Errors.conflict(`Esta categoria possui ${count} produto(s). Mova-os ou desative a categoria.`);
  await prisma.category.delete({ where: { id } });
}
