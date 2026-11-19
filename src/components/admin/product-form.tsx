"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FlaskConical, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { productSchema } from "@/lib/validators/admin";
import { PACKAGING_LABEL } from "@/lib/constants";
import { api } from "@/lib/api-client";
import { handleFormError } from "@/lib/form";
import { discountPercent, formatCents } from "@/lib/utils";
import { useAdminCategories } from "@/hooks/use-admin-categories";
import { Button } from "@/components/ui/button";
import { Input, Select, Switch, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/misc";
import { ProductVisual } from "@/components/product/product-visual";
import { ColorInput, MoneyInput } from "./inputs";

type FormIn = z.input<typeof productSchema>;
type FormOut = z.output<typeof productSchema>;

export interface ProductFormDefaults extends Partial<FormIn> {
  id?: string;
}

const EMPTY: FormIn = {
  name: "",
  sku: "",
  brand: "",
  description: "",
  categoryId: "",
  priceCents: 0,
  salePriceCents: null,
  stock: 0,
  imageUrl: "",
  packaging: "BOX",
  accentColor: "#059669",
  isActive: true,
  isFeatured: false,
  technicalInfo: [
    { label: "Apresentação", value: "" },
    { label: "Registro", value: "DEMO (fictício)" },
  ],
};

export function ProductForm({ initial }: { initial?: ProductFormDefaults }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: categories } = useAdminCategories();
  const isEdit = !!initial?.id;

  const { register, handleSubmit, control, formState, setError } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(productSchema),
    defaultValues: { ...EMPTY, ...initial },
  });
  const tech = useFieldArray({ control, name: "technicalInfo" });
  const preview = useWatch({ control });
  const e = formState.errors;

  const mutation = useMutation({
    mutationFn: async (values: FormOut) =>
      isEdit ? api.put(`/admin/products/${initial!.id}`, values) : api.post("/admin/products", values),
    onSuccess: () => {
      toast.success(isEdit ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso.");
      qc.invalidateQueries({ queryKey: ["admin"] });
      router.push("/admin/produtos");
      router.refresh();
    },
    onError: (err) => handleFormError(err, setError),
  });

  const price = Number(preview.priceCents) || 0;
  const sale = preview.salePriceCents ? Number(preview.salePriceCents) : null;

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/produtos" className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="size-4" /> Produtos
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isEdit ? "Editar produto" : "Novo produto"}</h1>
        </div>
        <Button type="submit" loading={mutation.isPending}>
          <Save className="size-4" /> {isEdit ? "Salvar alterações" : "Cadastrar produto"}
        </Button>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 font-bold text-slate-900">Informações básicas</h2>
            <div className="grid gap-4 sm:grid-cols-6">
              <Input label="Nome" required wrapperClassName="sm:col-span-4" error={e.name?.message} {...register("name")} />
              <Input label="Código (SKU)" required placeholder="MF-ANL-001" wrapperClassName="sm:col-span-2" className="font-mono uppercase" error={e.sku?.message} {...register("sku")} />
              <Input label="Marca" required wrapperClassName="sm:col-span-3" error={e.brand?.message} {...register("brand")} />
              <Select label="Categoria" required wrapperClassName="sm:col-span-3" error={e.categoryId?.message} {...register("categoryId")}>
                <option value="">Selecione...</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}{!c.isActive && " (inativa)"}</option>)}
              </Select>
              <Textarea label="Descrição" required rows={5} wrapperClassName="sm:col-span-6" error={e.description?.message} {...register("description")} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 font-bold text-slate-900">Preço e estoque</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Controller control={control} name="priceCents" render={({ field }) => <MoneyInput label="Preço" required value={field.value as number} onChange={field.onChange} error={e.priceCents?.message} />} />
              <Controller control={control} name="salePriceCents" render={({ field }) => <MoneyInput label="Preço promocional" allowEmpty value={field.value as number | null} onChange={field.onChange} error={e.salePriceCents?.message} hint="Opcional" />} />
              <Input label="Estoque (demonstrativo)" type="number" min={0} required error={e.stock?.message} {...register("stock")} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">Informações técnicas</h2>
                <p className="flex items-center gap-1 text-xs text-amber-700"><FlaskConical className="size-3.5" /> Exibidas com aviso de dados fictícios.</p>
              </div>
              <Button variant="soft" size="sm" onClick={() => tech.append({ label: "", value: "" })} disabled={tech.fields.length >= 20}>
                <Plus className="size-4" /> Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {tech.fields.map((f, i) => (
                <div key={f.id} className="grid grid-cols-[1fr_2fr_auto] items-start gap-2">
                  <Input placeholder="Rótulo" aria-label={`Rótulo ${i + 1}`} error={e.technicalInfo?.[i]?.label?.message} {...register(`technicalInfo.${i}.label`)} />
                  <Input placeholder="Valor" aria-label={`Valor ${i + 1}`} error={e.technicalInfo?.[i]?.value?.message} {...register(`technicalInfo.${i}.value`)} />
                  <button type="button" onClick={() => tech.remove(i)} className="mt-1 rounded-lg p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remover linha ${i + 1}`}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              {tech.fields.length === 0 && <p className="text-sm text-slate-500">Nenhuma informação técnica.</p>}
            </div>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-24">
          <Card className="p-6">
            <h2 className="mb-4 font-bold text-slate-900">Aparência</h2>
            <div className="space-y-4">
              <Select label="Embalagem (ilustração)" {...register("packaging")}>
                {Object.entries(PACKAGING_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
              <Controller control={control} name="accentColor" render={({ field }) => <ColorInput label="Cor da embalagem" value={field.value} onChange={field.onChange} error={e.accentColor?.message} />} />
              <Input label="URL da imagem (opcional)" placeholder="https://..." hint="Somente https. Sem imagem, usamos a ilustração." error={e.imageUrl?.message} {...register("imageUrl")} />
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
              <ProductVisual
                name={preview.name || "Produto"}
                packaging={preview.packaging ?? "BOX"}
                accentColor={preview.accentColor ?? "#059669"}
                imageUrl={preview.imageUrl && /^https:\/\//.test(preview.imageUrl) ? preview.imageUrl : null}
              />
              <div className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary">{preview.brand || "Marca"}</p>
                <p className="font-semibold text-slate-800">{preview.name || "Nome do produto"}</p>
                {sale && sale < price && <p className="text-xs text-slate-400 line-through">{formatCents(price)} <span className="font-bold text-red-500 no-underline">-{discountPercent(price, sale)}%</span></p>}
                <p className="text-lg font-extrabold">{formatCents(sale && sale < price ? sale : price)}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="font-bold text-slate-900">Visibilidade</h2>
            <Controller control={control} name="isActive" render={({ field }) => (
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-sm font-semibold text-slate-800">Produto ativo</p><p className="text-xs text-slate-500">Visível na loja</p></div>
                <Switch checked={field.value} onChange={field.onChange} label="Produto ativo" />
              </div>
            )} />
            <Controller control={control} name="isFeatured" render={({ field }) => (
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-sm font-semibold text-slate-800">Destaque</p><p className="text-xs text-slate-500">Aparece na vitrine da home</p></div>
                <Switch checked={field.value} onChange={field.onChange} label="Produto em destaque" />
              </div>
            )} />
          </Card>
        </div>
      </div>
    </form>
  );
}
