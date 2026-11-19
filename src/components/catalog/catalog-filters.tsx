"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { PRODUCT_SORTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { CategoryIcon } from "@/components/layout/category-icon";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

/** Atualiza os parâmetros da URL preservando os demais e voltando à página 1. */
function useUpdateParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("pagina");
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };
  return { params, update, pending };
}

function FiltersPanel({ categories, onApplied }: { categories: Category[]; onApplied?: () => void }) {
  const { params, update } = useUpdateParams();
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");
  const current = params.get("categoria");

  const apply = (changes: Record<string, string | null>) => {
    update(changes);
    onApplied?.();
  };

  return (
    <div className="space-y-7">
      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Categorias</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => apply({ categoria: null })}
              className={cn("w-full rounded-lg px-3 py-2 text-left text-sm transition-colors", !current ? "bg-primary-50 font-semibold text-primary-800" : "text-slate-600 hover:bg-slate-50")}
            >
              Todas as categorias
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => apply({ categoria: c.slug })}
                aria-pressed={current === c.slug}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  current === c.slug ? "bg-primary-50 font-semibold text-primary-800" : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <CategoryIcon name={c.icon} className="size-4 shrink-0" /> {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ min: min || null, max: max || null });
        }}
      >
        <h3 className="mb-3 text-sm font-bold text-slate-900">Faixa de preço (R$)</h3>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" inputMode="decimal" min={0} placeholder="Mín." value={min} onChange={(e) => setMin(e.target.value)} aria-label="Preço mínimo" />
          <Input type="number" inputMode="decimal" min={0} placeholder="Máx." value={max} onChange={(e) => setMax(e.target.value)} aria-label="Preço máximo" />
        </div>
        <Button type="submit" variant="soft" size="sm" className="mt-2 w-full">Aplicar preço</Button>
      </form>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Disponibilidade</h3>
        <Checkbox label="Somente em promoção" checked={params.get("promo") === "1"} onChange={(e) => apply({ promo: e.target.checked ? "1" : null })} />
        <Checkbox label="Somente em estoque" checked={params.get("estoque") === "1"} onChange={(e) => apply({ estoque: e.target.checked ? "1" : null })} />
      </div>
    </div>
  );
}

export function CatalogSidebar({ categories }: { categories: Category[] }) {
  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-44 rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
        <FiltersPanel categories={categories} />
      </div>
    </aside>
  );
}

export function CatalogToolbar({ categories, total }: { categories: Category[]; total: number }) {
  const { params, update, pending } = useUpdateParams();
  const [open, setOpen] = useState(false);
  const active = ["categoria", "min", "max", "promo", "estoque", "q"].filter((k) => params.get(k));

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500" aria-live="polite">
          {pending ? "Atualizando..." : <><strong className="text-slate-900">{total}</strong> {total === 1 ? "produto encontrado" : "produtos encontrados"}</>}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setOpen(true)}>
            <SlidersHorizontal className="size-4" /> Filtros {active.length > 0 && `(${active.length})`}
          </Button>
          <Select
            aria-label="Ordenar por"
            value={params.get("ordem") ?? "relevance"}
            onChange={(e) => update({ ordem: e.target.value === "relevance" ? null : e.target.value })}
            className="h-9 w-48 rounded-lg text-sm"
          >
            {Object.entries(PRODUCT_SORTS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
      </div>
      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {active.map((k) => {
            const v = params.get(k)!;
            const label =
              k === "categoria" ? categories.find((c) => c.slug === v)?.name ?? v
              : k === "min" ? `A partir de R$ ${v}`
              : k === "max" ? `Até R$ ${v}`
              : k === "promo" ? "Em promoção"
              : k === "estoque" ? "Em estoque"
              : `"${v}"`;
            return (
              <button key={k} onClick={() => update({ [k]: null })} className="flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800 hover:bg-primary-100">
                {label} <X className="size-3.5" aria-label="Remover filtro" />
              </button>
            );
          })}
          <button onClick={() => update(Object.fromEntries(active.map((k) => [k, null])))} className="text-xs font-semibold text-slate-500 underline-offset-2 hover:underline">
            Limpar tudo
          </button>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Filtrar produtos">
        <FiltersPanel categories={categories} onApplied={() => setOpen(false)} />
      </Modal>
    </div>
  );
}
