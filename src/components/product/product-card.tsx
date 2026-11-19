import Link from "next/link";
import type { ProductCardData } from "@/server/services/product.service";
import { discountPercent } from "@/lib/utils";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { Rating } from "@/components/ui/rating";
import { ProductVisual } from "./product-visual";
import { Price } from "./price";
import { AddToCartButton } from "./add-to-cart-button";

export function toCartProduct(p: ProductCardData) {
  return {
    productId: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    unitPriceCents: p.finalPriceCents,
    packaging: p.packaging,
    accentColor: p.accentColor,
    imageUrl: p.imageUrl,
    stock: p.stock,
  };
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const off = discountPercent(product.priceCents, product.salePriceCents);
  const lowStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-lift">
      <Link href={`/produtos/${product.slug}`} className="relative block" aria-label={product.name}>
        <ProductVisual
          name={product.name}
          packaging={product.packaging}
          accentColor={product.accentColor}
          imageUrl={product.imageUrl}
          className="transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {off > 0 && <span className="rounded-lg bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm">-{off}%</span>}
          {product.stock === 0 && <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">Esgotado</span>}
        </div>
        {lowStock && (
          <span className="absolute bottom-3 left-3 rounded-lg bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
            Últimas {product.stock} un.
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-secondary">{product.brand}</span>
          <Rating value={product.ratingAvg} />
        </div>
        <Link href={`/produtos/${product.slug}`} className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug text-slate-800 hover:text-primary">
          {product.name}
        </Link>
        <div className="mt-auto pt-1">
          <Price priceCents={product.priceCents} salePriceCents={product.salePriceCents} />
        </div>
        <AddToCartButton product={toCartProduct(product)} size="sm" className="mt-2" />
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white">
      <div className="aspect-square animate-pulse bg-slate-100" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-6 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-9 w-full animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}
