"use client";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { api } from "@/lib/api-client";
import { handleFormError } from "@/lib/form";
import { categorySchema } from "@/lib/validators/admin";
import { useAdminCategories, type AdminCategory } from "@/hooks/use-admin-categories";
import { Button } from "@/components/ui/button";
import { Input, Select, Switch } from "@/components/ui/field";
import { Badge, PageTitle } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Table, Td, Th, TableEmpty, TableSkeleton } from "@/components/admin/table";
import { CategoryIcon, CATEGORY_ICON_OPTIONS } from "@/components/layout/category-icon";

type FormIn = z.input<typeof categorySchema>;
type FormOut = z.output<typeof categorySchema>;

function CategoryModal({ category, open, onClose }: { category: AdminCategory | null; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, control, formState, setError } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(categorySchema),
    values: category
      ? { name: category.name, description: category.description ?? "", icon: category.icon, isActive: category.isActive, sortOrder: category.sortOrder }
      : { name: "", description: "", icon: "pill", isActive: true, sortOrder: 0 },
  });
  const mutation = useMutation({
    mutationFn: async (v: FormOut) => (category ? api.put(`/admin/categories/${category.id}`, v) : api.post("/admin/categories", v)),
    onSuccess: () => {
      toast.success(category ? "Categoria atualizada." : "Categoria criada.");
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      onClose();
    },
    onError: (e) => handleFormError(e, setError),
  });
  const icon = useWatch({ control, name: "icon" }) ?? "pill";
  const e = formState.errors;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? "Editar categoria" : "Nova categoria"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit((v) => mutation.mutate(v))} loading={mutation.isPending}>Salvar</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Input label="Nome" required wrapperClassName="sm:col-span-2" error={e.name?.message} {...register("name")} />
        <Input label="Descrição" wrapperClassName="sm:col-span-2" error={e.description?.message} {...register("description")} />
        <div className="flex items-end gap-2">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary"><CategoryIcon name={icon} className="size-5" /></span>
          <Select label="Ícone" wrapperClassName="flex-1" {...register("icon")}>
            {CATEGORY_ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
          </Select>
        </div>
        <Input label="Ordem" type="number" min={0} error={e.sortOrder?.message} {...register("sortOrder")} />
        <Controller control={control} name="isActive" render={({ field }) => (
          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch checked={!!field.value} onChange={field.onChange} label="Categoria ativa" />
            <span className="text-sm text-slate-700">Categoria ativa (visível na loja)</span>
          </div>
        )} />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { data, isLoading } = useAdminCategories();
  const [modal, setModal] = useState<{ open: boolean; category: AdminCategory | null }>({ open: false, category: null });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      toast.success("Categoria excluída.");
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
    onError: (e) => handleFormError(e),
  });

  return (
    <div>
      <PageTitle
        title="Categorias"
        description="Organize o catálogo. Categorias inativas ocultam seus produtos da loja."
        actions={<Button onClick={() => setModal({ open: true, category: null })}><Plus className="size-4" /> Nova categoria</Button>}
      />
      <Table>
        <thead>
          <tr><Th>Categoria</Th><Th>Slug</Th><Th className="text-right">Produtos</Th><Th className="text-right">Ordem</Th><Th>Status</Th><Th className="text-right">Ações</Th></tr>
        </thead>
        <tbody>
          {isLoading ? <TableSkeleton cols={6} rows={8} /> : !data?.length ? <TableEmpty cols={6} message="Nenhuma categoria cadastrada." /> : data.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50/60">
              <Td>
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-primary-50 text-primary"><CategoryIcon name={c.icon} className="size-4" /></span>
                  <div><p className="font-semibold text-slate-900">{c.name}</p><p className="text-xs text-slate-500">{c.description}</p></div>
                </div>
              </Td>
              <Td className="font-mono text-xs">{c.slug}</Td>
              <Td className="text-right">{c.productsCount}</Td>
              <Td className="text-right">{c.sortOrder}</Td>
              <Td>{c.isActive ? <Badge tone="success">Ativa</Badge> : <Badge>Inativa</Badge>}</Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <button onClick={() => setModal({ open: true, category: c })} className="rounded-lg p-2 text-slate-500 hover:bg-primary-50 hover:text-primary" aria-label={`Editar ${c.name}`}><Pencil className="size-4" /></button>
                  <button
                    onClick={async () => {
                      if (await confirm({ title: "Excluir categoria?", description: `"${c.name}" será excluída. Só é possível excluir categorias sem produtos.`, confirmLabel: "Excluir" })) remove.mutate(c.id);
                    }}
                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Excluir ${c.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <CategoryModal open={modal.open} category={modal.category} onClose={() => setModal({ open: false, category: null })} />
    </div>
  );
}
