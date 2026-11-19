"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, Phone, RotateCcw, UserRound } from "lucide-react";
import { toast } from "sonner";
import type { OrderStatus } from "@/generated/prisma/enums";
import { api } from "@/lib/api-client";
import { handleFormError } from "@/lib/form";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TRANSITIONS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Card, EmptyState, Skeleton } from "@/components/ui/misc";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { OrderDetail, type OrderWithDetails } from "@/components/order/order-detail";

type AdminOrder = OrderWithDetails & { user: { id: string; name: string; email: string; phone: string | null } };

export default function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [next, setNext] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: async () => (await api.get<{ order: AdminOrder }>(`/admin/orders/${id}`)).data.order,
  });

  const mutation = useMutation({
    mutationFn: async () => (await api.patch<{ order: AdminOrder }>(`/admin/orders/${id}`, { status: next, note: note || null })).data.order,
    onSuccess: (o) => {
      qc.setQueryData(["admin", "order", id], o);
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast.success(`Status alterado para "${ORDER_STATUS_LABEL[o.status]}".`);
      setNext("");
      setNote("");
    },
    onError: (e) => handleFormError(e),
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-80" /><Skeleton className="h-96 rounded-2xl" /></div>;
  if (isError || !order) return <EmptyState title="Pedido não encontrado" action={<ButtonLink href="/admin/pedidos">Voltar</ButtonLink>} />;

  const transitions = ORDER_STATUS_TRANSITIONS[order.status];

  const submit = async () => {
    if (!next) return;
    if (next === "CANCELED") {
      const ok = await confirm({ title: "Cancelar pedido?", description: "O estoque dos itens será devolvido e o cupom (se houver) liberado. Esta ação não pode ser desfeita.", confirmLabel: "Cancelar pedido" });
      if (!ok) return;
    }
    mutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pedidos" className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="size-4" /> Pedidos</Link>
        <h1 className="font-mono text-2xl font-bold text-slate-900">{order.number}</h1>
        <p className="text-sm text-slate-500">Criado em {formatDate(order.createdAt, true)}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900"><UserRound className="size-5 text-primary" /> Cliente</h2>
          <Link href={`/admin/clientes/${order.user.id}`} className="font-semibold text-slate-800 hover:text-primary">{order.user.name}</Link>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Mail className="size-4" /> {order.user.email}</p>
          {order.user.phone && <p className="flex items-center gap-2 text-sm text-slate-600"><Phone className="size-4" /> {order.user.phone}</p>}
        </Card>
        <Card className="p-6">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900"><RotateCcw className="size-5 text-primary" /> Alterar status</h2>
          {transitions.length === 0 ? (
            <p className="text-sm text-slate-500">Status final: <strong>{ORDER_STATUS_LABEL[order.status]}</strong>. Nenhuma alteração disponível.</p>
          ) : (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <Select aria-label="Novo status" value={next} onChange={(e) => setNext(e.target.value as OrderStatus)}>
                <option value="">Selecione o novo status...</option>
                {transitions.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
              </Select>
              <Input placeholder="Observação (opcional, aparece no histórico)" maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} aria-label="Observação" />
              <Button type="submit" disabled={!next} loading={mutation.isPending} className="w-full">Atualizar status</Button>
            </form>
          )}
        </Card>
      </div>

      <OrderDetail order={order} productLinks={false} />
    </div>
  );
}
