import "server-only";
import type { z } from "zod";
import type { profileSchema } from "@/lib/validators/account";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "../db";
import { Errors } from "../errors";
import { publicUserSelect } from "./auth.service";

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) throw Errors.unauthorized();
  return user;
}

export async function updateProfile(userId: string, input: z.output<typeof profileSchema>) {
  return prisma.user.update({ where: { id: userId }, data: input, select: publicUserSelect });
}

/** Listagem de clientes para o admin, com contagem e total gasto agregados. */
export async function listCustomers(params: { page: number; pageSize: number; q?: string }) {
  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(params.q
      ? { OR: [{ name: { contains: params.q, mode: "insensitive" } }, { email: { contains: params.q, mode: "insensitive" } }] }
      : {}),
  };
  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: { id: true, name: true, email: true, phone: true, city: true, state: true, createdAt: true, _count: { select: { orders: true } } },
    }),
  ]);
  const spent = users.length
    ? await prisma.order.groupBy({
        by: ["userId"],
        where: { userId: { in: users.map((u) => u.id) }, status: { notIn: ["CANCELED", "PENDING_PAYMENT"] } },
        _sum: { totalCents: true },
      })
    : [];
  const spentMap = new Map(spent.map((s) => [s.userId, s._sum.totalCents ?? 0]));
  return {
    total,
    page: params.page,
    pageSize: params.pageSize,
    items: users.map(({ _count, ...u }) => ({ ...u, ordersCount: _count.orders, totalSpentCents: spentMap.get(u.id) ?? 0 })),
  };
}

export async function getCustomer(id: string) {
  const user = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    select: {
      ...publicUserSelect,
      orders: {
        orderBy: { createdAt: "desc" },
        select: { id: true, number: true, status: true, totalCents: true, paymentMethod: true, createdAt: true, _count: { select: { items: true } } },
      },
    },
  });
  if (!user) throw Errors.notFound("Cliente não encontrado.");
  return user;
}
