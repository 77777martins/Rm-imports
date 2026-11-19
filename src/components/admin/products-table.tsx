"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import type { PackagingType } from "@/generated/prisma/enums";
import { api } from "@/lib/api-client";
import { handleFormError } from "@/lib/form";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { formatCents } from "@/lib/utils";
import { useAdminCategories } from "@/hooks/use-admin-categories";
import { ButtonLink } from "@/components/ui/button";
import { Select, Switch } from "@/components/ui/field";
import { PageTitle, Badge } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ProductVisual } from "@/components/product/product-visual";
import { Table, Td, Th, TableEmpty, TableSkeleton } from "./table";
import { SearchInput } from "./search-input";
import { ProductQuickEdit, type QuickEditProduct } from "./product-quick-edit";

interface Row {
  id: string;
  sku: string;
  name: string;
  brand: string;
  priceCents: number;
  salePriceCents: number | null;
  finalPriceCents: number;
  stock: number;
  imageUrl: string | null;
  packaging: PackagingType;
  accentColor: string;
  isActive: boolean;
  isFeatured: boolean;
  category: { name: string };
}

const PAGE_SIZE = 15;
const STATUS_OPTIONS = { "": "Todos os status", active: "Ativos", inactive: "Inativos", "low-stock": "Estoque baixo", "out-of-stock": "Esgotados" };

export function ProductsTable() {
  const params = useSearchParams();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { data: categories } = useAdminCategories();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [editing, setEditing] = useState<QuickEditProduct | null>(null);

  const filters = { page, pageSize: PAGE_SIZE, q: q || undefined, categoryId: categoryId || undefined, status: status || undefined };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "products", filters],
    queryFn: async () => (await api.get<{ total: number; items: Row[] }>("/admin/products", { params: filters })).data,
    placeholderData: keepPreviousData,
  });

  const onSearch = useCallback((value: string) => {
    setQ(value);
    setPage(1);
  }, []);

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/admin/products/${id}`, { isActive }),
    onSuccess: (_, v) => {
      toast.success(v.isActive ? "Produto ativado." : "Produto desativado.");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (e) => handleFormError(e),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => {
      toast.success("Produto excluído.");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => handleFormError(e),
  });

  return (
    <div>
      <PageTitle
        title="Produtos"
        description={data ? `${data.total} produtos encontrados` : "Gerencie o catálogo da loja."}
        actions={<ButtonLink href="/admin/produtos/novo"><Plus className="size-4" /> Novo produto</ButtonLink>}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px_200px]">
        <SearchInput onSearch={onSearch} placeholder="Buscar por nome, marca ou código" />
        <Select aria-label="Filtrar por categoria" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
          <option value="">Todas as categorias</option>
          {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select aria-label="Filtrar por status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {Object.entries(STATUS_OPTIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>

      <Table className={isFetching && !isLoading ? "opacity-70" : ""}>
        <thead>
          <tr>
            <Th>Produto</Th>
            <Th>Categoria</Th>
            <Th className="text-right">Preço</Th>
            <Th className="text-right">Estoque</Th>
            <Th>Ativo</Th>
            <Th className="text-right">Ações</Th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <TableSkeleton cols={6} />
          ) : !data?.items.length ? (
            <TableEmpty cols={6} message="Nenhum produto encontrado com esses filtros." />
          ) : (
            data.items.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/60">
                <Td>
                  <div className="flex items-center gap-3">
                    <ProductVisual name={p.name} packaging={p.packaging} accentColor={p.accentColor} imageUrl={p.imageUrl} className="size-11 shrink-0 rounded-lg" compact />
                    <div className="min-w-0">
                      <Link href={`/admin/produtos/${p.id}`} className="block truncate font-semibold text-slate-900 hover:text-primary">{p.name}</Link>
                      <p className="font-mono text-xs text-slate-400">{p.sku} · {p.brand}</p>
                    </div>
                    {p.isFeatured && <Badge tone="info">Destaque</Badge>}
                  </div>
                </Td>
                <Td>{p.category.name}</Td>
                <Td className="text-right">
                  {p.salePriceCents && <p className="text-xs text-slate-400 line-through">{formatCents(p.priceCents)}</p>}
                  <p className="font-semibold">{formatCents(p.finalPriceCents)}</p>
                </Td>
                <Td className="text-right">
                  <span className={p.stock === 0 ? "font-bold text-red-600" : p.stock <= LOW_STOCK_THRESHOLD ? "font-bold text-amber-600" : ""}>{p.stock}</span>
                </Td>
                <Td>
                  <Switch checked={p.isActive} label={`Ativar ${p.name}`} disabled={toggle.isPending} onChange={(isActive) => toggle.mutate({ id: p.id, isActive })} />
                </Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(p)} className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-600" aria-label={`Edição rápida de ${p.name}`} title="Preço e estoque">
                      <Zap className="size-4" />
                    </button>
                    <Link href={`/admin/produtos/${p.id}`} className="rounded-lg p-2 text-slate-500 hover:bg-primary-50 hover:text-primary" aria-label={`Editar ${p.name}`} title="Editar">
                      <Pencil className="size-4" />
                    </Link>
                    <button
                      onClick={async () => {
                        const ok = await confirm({
                          title: "Excluir produto?",
                          description: `"${p.name}" será removido permanentemente. Produtos já vendidos não podem ser excluídos — desative-os.`,
                          confirmLabel: "Excluir",
                        });
                        if (ok) remove.mutate(p.id);
                      }}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Excluir ${p.name}`}
                      title="Excluir"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      <div className="mt-6">
        <Pagination page={page} totalPages={Math.ceil((data?.total ?? 0) / PAGE_SIZE)} onPageChange={setPage} />
      </div>
      <ProductQuickEdit product={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
