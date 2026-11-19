"use client";

import Link from "next/link";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronRight, Package } from "lucide-react";
import type { OrderStatus, PaymentMethod } from "@/generated/prisma/enums";
import { api } from "@/lib/api-client";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatCents, formatDate } from "@/lib/utils";
import { ButtonLink, Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { OrderStatusBadge } from "@/components/order/order-status-badge";

interface OrderRow {
  id: string;
  number: string;
  status: OrderStatus;
  totalCents: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  _count: { items: number };
}

const PAGE_SIZE = 8;

export function OrdersList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["my-orders", page],
    queryFn: async () => (await api.get<{ total: number; items: OrderRow[] }>("/account/orders", { params: { page, pageSize: PAGE_SIZE } })).data,
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>;
  if (isError)
    return (
      <EmptyState title="Erro ao carregar pedidos" description="Verifique sua conexão." action={<Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>} />
    );
  if (!data || data.total === 0)
    return (
      <EmptyState
        icon={<Package className="size-7" />}
        title="Você ainda não fez pedidos"
        description="Quando você finalizar uma compra demonstrativa, ela aparecerá aqui."
        action={<ButtonLink href="/produtos">Começar a comprar</ButtonLink>}
      />
    );

  return (
    <div className={`space-y-3 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
      {data.items.map((o) => (
        <Link
          key={o.id}
          href={`/conta/pedidos/${o.number}`}
          className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-card transition-all hover:border-primary-200 hover:shadow-lift sm:p-5"
        >
          <div className="hidden size-12 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary sm:grid">
            <Package className="size-6" />
          </div>
          <div className="grid min-w-0 flex-1 gap-1 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6">
            <div className="min-w-0">
              <p className="font-mono text-sm font-bold text-slate-900">{o.number}</p>
              <p className="text-xs text-slate-500">
                {formatDate(o.createdAt, true)} · {o._count.items} {o._count.items === 1 ? "item" : "itens"} · {PAYMENT_METHOD_LABEL[o.paymentMethod]}
              </p>
            </div>
            <OrderStatusBadge status={o.status} />
            <p className="font-bold text-slate-900 sm:w-28 sm:text-right">{formatCents(o.totalCents)}</p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>
      ))}
      <div className="pt-4">
        <Pagination page={page} totalPages={Math.ceil(data.total / PAGE_SIZE)} onPageChange={setPage} />
      </div>
    </div>
  );
}
