"use client";

import Link from "next/link";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import type { OrderStatus, PaymentMethod } from "@/generated/prisma/enums";
import { api } from "@/lib/api-client";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatCents, formatDate } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, Skeleton } from "@/components/ui/misc";
import { StatCard } from "@/components/admin/stat-card";
import { Table, Td, Th, TableEmpty } from "@/components/admin/table";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { DollarSign, ShoppingBag } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
  orders: { id: string; number: string; status: OrderStatus; totalCents: number; paymentMethod: PaymentMethod; createdAt: string; _count: { items: number } }[];
}

export default function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: c, isLoading, isError } = useQuery({
    queryKey: ["admin", "customer", id],
    queryFn: async () => (await api.get<{ customer: Customer }>(`/admin/customers/${id}`)).data.customer,
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-80 rounded-2xl" /></div>;
  if (isError || !c) return <EmptyState title="Cliente não encontrado" action={<ButtonLink href="/admin/clientes">Voltar</ButtonLink>} />;

  const valid = c.orders.filter((o) => o.status !== "CANCELED" && o.status !== "PENDING_PAYMENT");
  const spent = valid.reduce((s, o) => s + o.totalCents, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/clientes" className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="size-4" /> Clientes</Link>
        <h1 className="text-2xl font-bold text-slate-900">{c.name}</h1>
        <p className="text-sm text-slate-500">Cliente desde {formatDate(c.createdAt)}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-2 p-5 text-sm text-slate-600">
          <p className="flex items-center gap-2"><Mail className="size-4 text-primary" /> {c.email}</p>
          <p className="flex items-center gap-2"><Phone className="size-4 text-primary" /> {c.phone ?? "Não informado"}</p>
          <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            {c.street ? <span>{c.street}, {c.number}{c.complement && ` — ${c.complement}`}<br />{c.district} · {c.city}/{c.state} · {c.zipCode}</span> : "Endereço não cadastrado"}
          </p>
        </Card>
        <StatCard label="Pedidos" value={String(c.orders.length)} hint={`${valid.length} pagos/concluídos`} icon={<ShoppingBag className="size-5" />} tone="secondary" />
        <StatCard label="Total gasto" value={formatCents(spent)} hint={valid.length ? `Ticket médio ${formatCents(Math.round(spent / valid.length))}` : "Sem compras pagas"} icon={<DollarSign className="size-5" />} />
      </div>
      <div>
        <h2 className="mb-3 font-bold text-slate-900">Histórico de pedidos</h2>
        <Table>
          <thead><tr><Th>Pedido</Th><Th>Data</Th><Th>Pagamento</Th><Th>Status</Th><Th className="text-right">Total</Th></tr></thead>
          <tbody>
            {c.orders.length === 0 ? <TableEmpty cols={5} message="Este cliente ainda não fez pedidos." /> : c.orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/60">
                <Td><Link href={`/admin/pedidos/${o.id}`} className="font-mono text-xs font-bold hover:text-primary">{o.number}</Link></Td>
                <Td>{formatDate(o.createdAt, true)}</Td>
                <Td>{PAYMENT_METHOD_LABEL[o.paymentMethod]}</Td>
                <Td><OrderStatusBadge status={o.status} /></Td>
                <Td className="text-right font-semibold">{formatCents(o.totalCents)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
