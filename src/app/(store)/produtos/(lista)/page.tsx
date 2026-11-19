import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PackageSearch } from "lucide-react";
import { catalogQuerySchema } from "@/lib/validators/catalog";
import { searchCatalog } from "@/server/services/product.service";
import { listActiveCategories } from "@/server/services/category.service";
import { ProductCard } from "@/components/product/product-card";
import { CatalogSidebar, CatalogToolbar } from "@/components/catalog/catalog-filters";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function normalize(sp: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const q = catalogQuerySchema.parse(normalize(await searchParams));
  if (q.q) return { title: `Busca: ${q.q}` };
  if (q.categoria) {
    const cat = (await listActiveCategories()).find((c) => c.slug === q.categoria);
    if (cat) return { title: cat.name, description: cat.description ?? undefined };
  }
  return { title: q.promo ? "Ofertas" : "Todos os produtos" };
}

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = normalize(await searchParams);
  const query = catalogQuerySchema.parse(raw);
  const [result, categories] = await Promise.all([searchCatalog(query), listActiveCategories()]);
  const category = categories.find((c) => c.slug === query.categoria);
  const title = query.q ? `Resultados para "${query.q}"` : category?.name ?? (query.promo ? "Ofertas" : "Todos os produtos");

  const hrefFor = (page: number) => {
    const p = new URLSearchParams(Object.entries(raw).filter((e): e is [string, string] => !!e[1]));
    p.set("pagina", String(page));
    return `/produtos?${p.toString()}`;
  };

  return (
    <div className="container-page py-8">
      <nav aria-label="Trilha" className="mb-3 text-xs text-slate-500">
        <Link href="/" className="hover:text-primary">Início</Link> <span aria-hidden>/</span>{" "}
        <Link href="/produtos" className="hover:text-primary">Produtos</Link>
        {category && <> <span aria-hidden>/</span> <span className="text-slate-700">{category.name}</span></>}
      </nav>
      <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
      {category?.description && <p className="mb-6 text-sm text-slate-500">{category.description}</p>}

      <div className="mt-6 flex gap-8">
        <Suspense>
          <CatalogSidebar categories={categories} />
        </Suspense>
        <div className="min-w-0 flex-1">
          <Suspense>
            <CatalogToolbar categories={categories} total={result.total} />
          </Suspense>
          {result.items.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="size-7" />}
              title="Nenhum produto encontrado"
              description="Tente outros termos de busca ou remova alguns filtros."
              action={<ButtonLink href="/produtos" variant="soft">Ver todos os produtos</ButtonLink>}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {result.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <div className="mt-10">
                <Pagination page={result.page} totalPages={result.totalPages} hrefFor={hrefFor} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
