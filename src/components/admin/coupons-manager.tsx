"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import type { CouponType } from "@/generated/prisma/enums";
import { api } from "@/lib/api-client";
import { handleFormError } from "@/lib/form";
import { couponSchema } from "@/lib/validators/admin";
import { COUPON_TYPE_LABEL } from "@/lib/constants";
import { formatCents, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select, Switch } from "@/components/ui/field";
import { Badge } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Table, Td, Th, TableEmpty, TableSkeleton } from "./table";
import { MoneyInput } from "./inputs";

type FormIn = z.input<typeof couponSchema>;
type FormOut = z.output<typeof couponSchema>;
interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  minSubtotalCents: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
}

function describeValue(c: Pick<Coupon, "type" | "value">) {
  return c.type === "PERCENT" ? `${c.value}%` : c.type === "FIXED" ? formatCents(c.value) : "Frete grátis";
}

function CouponModal({ coupon, open, onClose }: { coupon: Coupon | null; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, control, formState, setError } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(couponSchema),
    values: coupon
      ? { ...coupon, description: coupon.description ?? "", expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "" }
      : { code: "", description: "", type: "PERCENT", value: 10, minSubtotalCents: 0, maxUses: null, expiresAt: "", isActive: true },
  });
  const type = useWatch({ control, name: "type" });
  const mutation = useMutation({
    mutationFn: async (v: FormOut) => (coupon ? api.put(`/admin/coupons/${coupon.id}`, v) : api.post("/admin/coupons", v)),
    onSuccess: () => {
      toast.success(coupon ? "Cupom atualizado." : "Cupom criado.");
      qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
      onClose();
    },
    onError: (e) => handleFormError(e, setError),
  });
  const e = formState.errors;
  const submit = handleSubmit((v) => mutation.mutate(v));

  return (
    <Modal open={open} onClose={onClose} title={coupon ? "Editar cupom" : "Novo cupom"} footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={submit} loading={mutation.isPending}>Salvar</Button></>}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Input label="Código" required className="font-mono uppercase" error={e.code?.message} {...register("code")} />
        <Select label="Tipo" {...register("type")}>
          {Object.entries(COUPON_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
        <Input label="Descrição" wrapperClassName="sm:col-span-2" error={e.description?.message} {...register("description")} />
        {type === "PERCENT" && <Input label="Desconto (%)" type="number" min={1} max={100} error={e.value?.message} {...register("value")} />}
        {type === "FIXED" && <Controller control={control} name="value" render={({ field }) => <MoneyInput label="Valor do desconto" value={field.value as number} onChange={field.onChange} error={e.value?.message} />} />}
        {type === "FREE_SHIPPING" && <input type="hidden" value={0} {...register("value")} />}
        <Controller control={control} name="minSubtotalCents" render={({ field }) => <MoneyInput label="Pedido mínimo" value={field.value as number} onChange={field.onChange} error={e.minSubtotalCents?.message} />} />
        <Input label="Limite de usos" type="number" min={1} placeholder="Ilimitado" error={e.maxUses?.message} {...register("maxUses", { setValueAs: (v) => (v === "" || v === null ? null : Number(v)) })} />
        <Input label="Expira em" type="date" error={e.expiresAt?.message} {...register("expiresAt")} />
        <Controller control={control} name="isActive" render={({ field }) => (
          <div className="flex items-center gap-3 sm:col-span-2"><Switch checked={field.value} onChange={field.onChange} label="Cupom ativo" /><span className="text-sm">Cupom ativo</span></div>
        )} />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

export function CouponsManager() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [modal, setModal] = useState<{ open: boolean; coupon: Coupon | null }>({ open: false, coupon: null });
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: async () => (await api.get<{ items: Coupon[] }>("/admin/coupons")).data.items,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/coupons/${id}`),
    onSuccess: () => { toast.success("Cupom excluído."); qc.invalidateQueries({ queryKey: ["admin", "coupons"] }); },
    onError: (e) => handleFormError(e),
  });

  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={() => setModal({ open: true, coupon: null })}><Plus className="size-4" /> Novo cupom</Button></div>
      <Table>
        <thead><tr><Th>Código</Th><Th>Desconto</Th><Th>Mínimo</Th><Th>Usos</Th><Th>Validade</Th><Th>Status</Th><Th className="text-right">Ações</Th></tr></thead>
        <tbody>
          {isLoading ? <TableSkeleton cols={7} rows={4} /> : !data?.length ? <TableEmpty cols={7} message="Nenhum cupom cadastrado." /> : data.map((c) => {
            const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
            return (
              <tr key={c.id} className="hover:bg-slate-50/60">
                <Td><p className="font-mono font-bold text-slate-900">{c.code}</p><p className="text-xs text-slate-400">{c.description}</p></Td>
                <Td>{describeValue(c)}</Td>
                <Td>{c.minSubtotalCents ? formatCents(c.minSubtotalCents) : "—"}</Td>
                <Td>{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</Td>
                <Td>{c.expiresAt ? formatDate(c.expiresAt) : "Sem validade"}</Td>
                <Td>{!c.isActive ? <Badge>Inativo</Badge> : expired ? <Badge tone="danger">Expirado</Badge> : <Badge tone="success">Ativo</Badge>}</Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setModal({ open: true, coupon: c })} className="rounded-lg p-2 text-slate-500 hover:bg-primary-50 hover:text-primary" aria-label={`Editar ${c.code}`}><Pencil className="size-4" /></button>
                    <button onClick={async () => { if (await confirm({ title: "Excluir cupom?", description: `O cupom ${c.code} será excluído. Cupons já usados devem ser desativados.`, confirmLabel: "Excluir" })) remove.mutate(c.id); }} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label={`Excluir ${c.code}`}><Trash2 className="size-4" /></button>
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <CouponModal open={modal.open} coupon={modal.coupon} onClose={() => setModal({ open: false, coupon: null })} />
    </div>
  );
}
