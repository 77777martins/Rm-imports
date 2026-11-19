import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreditCard, FlaskConical, QrCode, ShieldCheck } from "lucide-react";
import { getProductBySlug } from "@/server/services/product.service";
import { getSettings } from "@/server/services/settings.service";
import { ProductVisual } from "@/components/product/product-visual";
import { Price } from "@/components/product/price";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductCard, toCartProduct } from "@/components/product/product-card";
import { Rating } from "@/components/ui/rating";
import { Badge } from "@/components/ui/misc";
import { discountPercent } from "@/lib/utils";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";

type Params = Promise<{ slug: string }>;

function validSlug(slug: string) {
  return /^[a-z0-9-]{1,180}$/.test(slug);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = validSlug(slug) ? await getProductBySlug(slug) : null;
  if (!data) return { title: "Produto não encontrado" };
  return {
    title: data.product.name,
    description: data.product.description.slice(0, 155),
    openGraph: { title: data.product.name, description: data.product.description.slice(0, 155) },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  if (!validSlug(slug)) notFound();
  const [data, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!data) notFound();
  const { product, related } = data;
  const technicalInfo = Array.isArray(product.technicalInfo) ? (product.technicalInfo as { label: string; value: string }[]) : [];
  const off = discountPercent(product.priceCents, product.salePriceCents);

  // JSON-LD (SEO). O "<" é escapado para impedir quebra do <script>.
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    description: product.description,
    aggregateRating: { "@type": "AggregateRating", ratingValue: product.ratingAvg, reviewCount: product.ratingCount },
  }).replace(/</g, "\\u003c");

  return (
    <div className="container-page py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label="Trilha" className="mb-6 text-xs text-slate-500">
        <Link href="/" className="hover:text-primary">Início</Link> /{" "}
        <Link href={`/produtos?categoria=${product.category.slug}`} className="hover:text-primary">{product.category.name}</Link> /{" "}
        <span className="text-slate-700">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative">
          <div className="sticky top-44 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card">
            <ProductVisual name={product.name} packaging={product.packaging} accentColor={product.accentColor} imageUrl={product.imageUrl} className="p-6" />
            {off > 0 && <span className="absolute left-5 top-5 rounded-xl bg-red-500 px-3 py-1 text-sm font-bold text-white">-{off}% OFF</span>}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">{product.brand}</span>
              <Badge tone="warning"><FlaskConical className="size-3" /> Produto fictício</Badge>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <Rating value={product.ratingAvg} count={product.ratingCount} />
              <span>Cód.: <span className="font-mono text-slate-700">{product.sku}</span></span>
              <span>{product.soldCount} vendidos</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
            <Price priceCents={product.priceCents} salePriceCents={product.salePriceCents} size="lg" />
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><QrCode className="size-3.5 text-primary" /> PIX com aprovação imediata</span>
              <span className="flex items-center gap-1"><CreditCard className="size-3.5 text-primary" /> Cartão em até 6x</span>
            </div>
            <p className="mt-4 text-sm font-medium">
              {product.stock === 0 ? (
                <span className="text-red-600">Esgotado</span>
              ) : product.stock <= LOW_STOCK_THRESHOLD ? (
                <span className="text-amber-700">Restam apenas {product.stock} unidades</span>
              ) : (
                <span className="text-emerald-700">Em estoque ({product.stock} unidades)</span>
              )}
            </p>
            <div className="mt-5">
              <ProductPurchase product={toCartProduct(product)} freeShippingMinCents={settings.freeShippingMinCents} />
            </div>
          </div>

          <p className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="size-4 text-primary" /> Compra demonstrativa: nenhum valor é cobrado e nenhum produto é enviado.
          </p>
        </div>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Descrição</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{product.description}</p>
        </section>
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <h2 className="mb-1 text-lg font-bold text-slate-900">Informações técnicas</h2>
          <p className="mb-4 flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <FlaskConical className="size-3.5" /> Dados FICTÍCIOS para demonstração. Não use como referência de saúde.
          </p>
          <dl className="divide-y divide-slate-100 text-sm">
            {technicalInfo.map((row) => (
              <div key={row.label} className="grid grid-cols-[40%_1fr] gap-3 py-2.5">
                <dt className="font-medium text-slate-500">{row.label}</dt>
                <dd className="text-slate-800">{row.value}</dd>
              </div>
            ))}
            <div className="grid grid-cols-[40%_1fr] gap-3 py-2.5">
              <dt className="font-medium text-slate-500">Categoria</dt>
              <dd className="text-slate-800">{product.category.name}</dd>
            </div>
          </dl>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-slate-900">Você também pode gostar</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
