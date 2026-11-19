"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { api } from "@/lib/api-client";
import { handleFormError } from "@/lib/form";
import { bannerSchema } from "@/lib/validators/admin";
import { Button } from "@/components/ui/button";
import { Input, Switch } from "@/components/ui/field";
import { Badge, EmptyState, Skeleton } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ColorInput } from "./inputs";

type FormIn = z.input<typeof bannerSchema>;
type FormOut = z.output<typeof bannerSchema>;
interface Banner extends FormOut { id: string }

const EMPTY: FormIn = { title: "", subtitle: "", ctaLabel: "Ver ofertas", ctaHref: "/produtos", imageUrl: "", colorFrom: "#059669", colorTo: "#0284c7", isActive: true, sortOrder: 0 };

function BannerModal({ banner, open, onClose }: { banner: Banner | null; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, control, formState, setError } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(bannerSchema),
    values: banner ? { ...banner, subtitle: banner.subtitle ?? "", ctaLabel: banner.ctaLabel ?? "", ctaHref: banner.ctaHref ?? "", imageUrl: banner.imageUrl ?? "" } : EMPTY,
  });
  const mutation = useMutation({
    mutationFn: async (v: FormOut) => (banner ? api.put(`/admin/banners/${banner.id}`, v) : api.post("/admin/banners", v)),
    onSuccess: () => {
      toast.success(banner ? "Banner atualizado." : "Banner criado.");
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      onClose();
    },
    onError: (e) => handleFormError(e, setError),
  });
  const [title, subtitle, colorFrom, colorTo] = useWatch({ control, name: ["title", "subtitle", "colorFrom", "colorTo"] });
  const e = formState.errors;
  const submit = handleSubmit((v) => mutation.mutate(v));

  return (
    <Modal open={open} onClose={onClose} size="lg" title={banner ? "Editar banner" : "Novo banner"} footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={submit} loading={mutation.isPending}>Salvar</Button></>}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="rounded-2xl p-5 text-white sm:col-span-2" style={{ background: `linear-gradient(120deg, ${colorFrom}, ${colorTo})` }}>
          <p className="text-lg font-extrabold">{title || "Título do banner"}</p>
          <p className="text-sm text-white/85">{subtitle}</p>
        </div>
        <Input label="Título" required wrapperClassName="sm:col-span-2" error={e.title?.message} {...register("title")} />
        <Input label="Subtítulo" wrapperClassName="sm:col-span-2" error={e.subtitle?.message} {...register("subtitle")} />
        <Input label="Texto do botão" error={e.ctaLabel?.message} {...register("ctaLabel")} />
        <Input label="Link do botão" placeholder="/produtos?promo=1" hint="Apenas caminhos internos." error={e.ctaHref?.message} {...register("ctaHref")} />
        <Input label="Imagem (opcional)" placeholder="https://..." wrapperClassName="sm:col-span-2" error={e.imageUrl?.message} {...register("imageUrl")} />
        <Controller control={control} name="colorFrom" render={({ field }) => <ColorInput label="Cor inicial" value={field.value} onChange={field.onChange} error={e.colorFrom?.message} />} />
        <Controller control={control} name="colorTo" render={({ field }) => <ColorInput label="Cor final" value={field.value} onChange={field.onChange} error={e.colorTo?.message} />} />
        <Input label="Ordem" type="number" min={0} error={e.sortOrder?.message} {...register("sortOrder")} />
        <Controller control={control} name="isActive" render={({ field }) => (
          <div className="flex items-center gap-3 pt-7"><Switch checked={field.value} onChange={field.onChange} label="Banner ativo" /><span className="text-sm">Ativo</span></div>
        )} />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

export function BannersManager() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [modal, setModal] = useState<{ open: boolean; banner: Banner | null }>({ open: false, banner: null });
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: async () => (await api.get<{ items: Banner[] }>("/admin/banners")).data.items,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/banners/${id}`),
    onSuccess: () => { toast.success("Banner excluído."); qc.invalidateQueries({ queryKey: ["admin", "banners"] }); },
    onError: (e) => handleFormError(e),
  });

  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={() => setModal({ open: true, banner: null })}><Plus className="size-4" /> Novo banner</Button></div>
      {isLoading ? <Skeleton className="h-60 rounded-2xl" /> : !data?.length ? (
        <EmptyState title="Nenhum banner" description="Crie banners para o carrossel da página inicial." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((b) => (
            <div key={b.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
              <div className="p-5 text-white" style={{ background: `linear-gradient(120deg, ${b.colorFrom}, ${b.colorTo})` }}>
                <p className="font-extrabold">{b.title}</p>
                <p className="line-clamp-2 text-sm text-white/85">{b.subtitle}</p>
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {b.isActive ? <Badge tone="success">Ativo</Badge> : <Badge>Inativo</Badge>} Ordem {b.sortOrder} · {b.ctaHref ?? "sem link"}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setModal({ open: true, banner: b })} className="rounded-lg p-2 text-slate-500 hover:bg-primary-50 hover:text-primary" aria-label={`Editar ${b.title}`}><Pencil className="size-4" /></button>
                  <button onClick={async () => { if (await confirm({ title: "Excluir banner?", description: `"${b.title}" será removido do carrossel.`, confirmLabel: "Excluir" })) remove.mutate(b.id); }} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label={`Excluir ${b.title}`}><Trash2 className="size-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <BannerModal open={modal.open} banner={modal.banner} onClose={() => setModal({ open: false, banner: null })} />
    </div>
  );
}
