import "server-only";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { prisma } from "../db";

const REVENUE_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

/** Métricas do painel — consultas agregadas executadas em paralelo. */
export async function getDashboard(days = 30) {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const [ordersCount, revenue, productsCount, activeProducts, customersCount, lowStockCount, lowStock, byStatus, dailyRaw, topRaw, recent] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ where: { status: { in: [...REVENUE_STATUSES] } }, _sum: { totalCents: true }, _avg: { totalCents: true } }),
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count({ where: { stock: { lte: LOW_STOCK_THRESHOLD }, isActive: true } }),
      prisma.product.findMany({
        where: { stock: { lte: LOW_STOCK_THRESHOLD }, isActive: true },
        orderBy: { stock: "asc" },
        take: 8,
        select: { id: true, name: true, sku: true, stock: true },
      }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      // Consulta parametrizada (tagged template) — sem risco de SQL Injection.
      prisma.$queryRaw<{ day: Date; orders: bigint; revenue: bigint | null }[]>`
        SELECT date_trunc('day', "createdAt") AS day,
               COUNT(*) AS orders,
               SUM(CASE WHEN status IN ('PAID','PROCESSING','SHIPPED','DELIVERED') THEN "totalCents" ELSE 0 END) AS revenue
        FROM "Order"
        WHERE "createdAt" >= ${since}
        GROUP BY 1 ORDER BY 1`,
      prisma.orderItem.groupBy({
        by: ["productId", "productName"],
        where: { order: { status: { in: [...REVENUE_STATUSES] } } },
        _sum: { quantity: true, totalCents: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, number: true, status: true, totalCents: true, createdAt: true, user: { select: { name: true } } },
      }),
    ]);

  // Preenche dias sem vendas para o gráfico ficar contínuo.
  const dailyMap = new Map(dailyRaw.map((r) => [r.day.toISOString().slice(0, 10), r]));
  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    const row = dailyMap.get(key);
    return { date: key, orders: Number(row?.orders ?? 0), revenueCents: Number(row?.revenue ?? 0) };
  });

  return {
    totals: {
      orders: ordersCount,
      revenueCents: revenue._sum.totalCents ?? 0,
      averageTicketCents: Math.round(revenue._avg.totalCents ?? 0),
      products: productsCount,
      activeProducts,
      customers: customersCount,
      lowStock: lowStockCount,
    },
    lowStock,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
    daily,
    topProducts: topRaw.map((t) => ({
      productId: t.productId,
      name: t.productName,
      quantity: t._sum.quantity ?? 0,
      revenueCents: t._sum.totalCents ?? 0,
    })),
    recent,
  };
}
