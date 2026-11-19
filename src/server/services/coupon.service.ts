import "server-only";
import type { z } from "zod";
import type { couponSchema } from "@/lib/validators/admin";
import { prisma } from "../db";
import { Errors } from "../errors";

export async function listCouponsAdmin() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return coupons;
}


export function createCoupon(input: z.output<typeof couponSchema>) {
  return prisma.coupon.create({ data: input });
}

export function updateCoupon(id: string, input: z.output<typeof couponSchema>) {
  return prisma.coupon.update({ where: { id }, data: input });
}

export async function deleteCoupon(id: string) {
  const used = await prisma.order.count({ where: { couponId: id } });
  if (used > 0) throw Errors.conflict("Cupom já utilizado em pedidos. Desative-o em vez de excluir.");
  await prisma.coupon.delete({ where: { id } });
}
