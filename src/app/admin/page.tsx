"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Package, ShoppingBag, TriangleAlert, Users, Receipt } from "lucide-react";
import type { OrderStatus } from "@/generated/prisma/enums";
import { api } from "@/lib/api-client";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { formatCents, formatDate } from "@/lib/utils";
import { Card, PageTitle, Skeleton, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/admin/stat-card";
import { HorizontalBars, RevenueChart } from "@/components/admin/dashboard-charts";
import { OrderStatusBadge } from "@/components/order/order-status-badge";

interface Dashboard {
  totals: { orders: number; revenueCents: number; averageTicketCents: number; products: number; activeProducts: number; customers: number; lowStock: number };
  lowStock: { id: string; name: string; sku: string; stock: number }[];
  byStatus: { status: OrderStatus; count: number }[];
  daily: { date: string; orders: number; revenueCents: number }[];
  topProducts: { productId: string; name: string; quantity: number; revenueCents: number }[];
  recent: { id: string; number: string; status: OrderStatus; totalCents: number; createdAt: string; user: { name: string } }[];
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => (await api.get<Dashboard>("/admin/dashboard")).data,
  });

  if (isError) return <EmptyState title="Erro ao carregar o dashboard" action={<Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>} />;

  const revenue30 = data?.daily.reduce((s, d) => s + d.revenueCents, 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageTitle title="Dashboard" description="Visão geral da loja (dados demonstrativos)." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {isLoading || !data ? (
          Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
        ) : (
          <>
            <StatCard label="Faturamento total" value={formatCents(data.totals.revenueCents)} hint={`Ticket médio ${formatCents(data.totals.averageTicketCents)}`} icon={<DollarSign className="size-5" />} />
            <StatCard label="Pedidos" value={String(data.totals.orders)} hint={`${formatCents(revenue30)} nos últimos 30 dias`} icon={<ShoppingBag className="size-5" />} tone="secondary" />
            <StatCard label="Produtos" value={String(data.totals.products)} hint={`${data.totals.activeProducts} ativos na loja`} icon={<Package className="size-5" />} tone="violet" />
            <StatCard label="Estoque baixo" value={String(data.totals.lowStock)} hint="Produtos com 10 un. ou menos" icon={<TriangleAlert className="size-5" />} tone="amber" />
            <StatCard label="Clientes" value={String(data.totals.customers)} hint="Contas de clientes cadastradas" icon={<Users className="size-5" />} tone="secondary" />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <h2 className="font-bold text-slate-900">Faturamento diário — últimos 30 dias</h2>
          <p className="mb-4 text-xs text-slate-500">Considera pedidos pagos, em separação, enviados e entregues.</p>
          {data ? <RevenueChart data={data.daily} /> : <Skeleton className="h-[280px]" />}
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-bold text-slate-900">Pedidos por status</h2>
          {data ? (
            <HorizontalBars
              data={[...data.byStatus].sort((a, b) => b.count - a.count).map((s) => ({ name: ORDER_STATUS_LABEL[s.status], value: s.count }))}
              format={(v) => String(v)}
            />
          ) : (
            <Skeleton className="h-60" />
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <h2 className="mb-4 font-bold text-slate-900">Mais vendidos (unidades)</h2>
          {data ? (
            data.topProducts.length ? (
              <HorizontalBars color="var(--primary)" data={data.topProducts.map((p) => ({ name: p.name, value: p.quantity }))} format={(v) => `${v} un.`} />
            ) : (
              <p className="text-sm text-slate-500">Sem vendas registradas.</p>
            )
          ) : (
            <Skeleton className="h-52" />
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Estoque baixo</h2>
            <Link href="/admin/produtos?status=low-stock" className="text-xs font-semibold text-primary hover:underline">Ver todos</Link>
          </div>
          {data ? (
            data.lowStock.length ? (
              <ul className="divide-y divide-slate-100">
                {data.lowStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/admin/produtos/${p.id}`} className="min-w-0 hover:text-primary">
                      <p className="truncate text-sm font-semibold text-slate-800">{p.name}</p>
                      <p className="font-mono text-xs text-slate-400">{p.sku}</p>
                    </Link>
                    <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold ${p.stock === 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                      {p.stock === 0 ? "Esgotado" : `${p.stock} un.`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Nenhum produto com estoque baixo. 🎉</p>
            )
          ) : (
            <Skeleton className="h-52" />
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Pedidos recentes</h2>
            <Link href="/admin/pedidos" className="text-xs font-semibold text-primary hover:underline">Ver todos</Link>
          </div>
          {data ? (
            <ul className="divide-y divide-slate-100">
              {data.recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/pedidos/${o.id}`} className="flex items-center gap-3 py-2.5 hover:text-primary">
                    <Receipt className="size-4 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{o.user.name}</p>
                      <p className="text-xs text-slate-400">{formatDate(o.createdAt, true)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{formatCents(o.totalCents)}</p>
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Skeleton className="h-52" />
          )}
        </Card>
      </div>
    </div>
  );
}
