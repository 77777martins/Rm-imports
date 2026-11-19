"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import type { OrderStatus, PaymentMethod } from "@/generated/prisma/enums";
import { api } from "@/lib/api-client";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatCents, formatDate } from "@/lib/utils";
import { Select } from "@/components/ui/field";
import { PageTitle } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { Table, Td, Th, TableEmpty, TableSkeleton } from "@/components/admin/table";
import { SearchInput } from "@/components/admin/search-input";
import { OrderStatusBadge } from "@/components/order/order-status-badge";

interface Row {
  id: string;
  number: string;
  status: OrderStatus;
  totalCents: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  user: { id: string; name: string; email: string };
  _count: { items: number };
}

const PAGE_SIZE = 15;

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const filters = { page, pageSize: PAGE_SIZE, q: q || undefined, status: status || undefined };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "orders", filters],
    queryFn: async () => (await api.get<{ total: number; items: Row[] }>("/admin/orders", { params: filters })).data,
    placeholderData: keepPreviousData,
  });
  const onSearch = useCallback((v: string) => { setQ(v); setPage(1); }, []);

  return (
    <div>
      <PageTitle title="Pedidos" description={data ? `${data.total} pedidos encontrados` : "Acompanhe e atualize os pedidos."} />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_240px]">
        <SearchInput onSearch={onSearch} placeholder="Buscar por número, cliente ou e-mail" />
        <Select aria-label="Filtrar por status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Todos os status</option>
          {Object.entries(ORDER_STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>
      <Table className={isFetching && !isLoading ? "opacity-70" : ""}>
        <thead>
          <tr><Th>Pedido</Th><Th>Cliente</Th><Th>Data</Th><Th>Pagamento</Th><Th>Status</Th><Th className="text-right">Total</Th><Th /></tr>
        </thead>
        <tbody>
          {isLoading ? <TableSkeleton cols={7} /> : !data?.items.length ? <TableEmpty cols={7} message="Nenhum pedido encontrado." /> : data.items.map((o) => (
            <tr key={o.id} className="hover:bg-slate-50/60">
              <Td><Link href={`/admin/pedidos/${o.id}`} className="font-mono text-xs font-bold text-slate-900 hover:text-primary">{o.number}</Link><p className="text-xs text-slate-400">{o._count.items} item(ns)</p></Td>
              <Td><Link href={`/admin/clientes/${o.user.id}`} className="font-medium hover:text-primary">{o.user.name}</Link><p className="text-xs text-slate-400">{o.user.email}</p></Td>
              <Td className="whitespace-nowrap">{formatDate(o.createdAt, true)}</Td>
              <Td>{PAYMENT_METHOD_LABEL[o.paymentMethod]}</Td>
              <Td><OrderStatusBadge status={o.status} /></Td>
              <Td className="text-right font-semibold">{formatCents(o.totalCents)}</Td>
              <Td><Link href={`/admin/pedidos/${o.id}`} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-primary-50 hover:text-primary" aria-label={`Ver pedido ${o.number}`}><Eye className="size-4" /></Link></Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="mt-6"><Pagination page={page} totalPages={Math.ceil((data?.total ?? 0) / PAGE_SIZE)} onPageChange={setPage} /></div>
    </div>
  );
}
