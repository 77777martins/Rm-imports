"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag, Trash2, TriangleAlert, Lock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCartStore } from "@/stores/cart-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useCartQuote } from "@/hooks/use-cart-quote";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ButtonLink, Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { ProductVisual } from "@/components/product/product-visual";
import { QuantityStepper } from "@/components/product/quantity-stepper";
import { MAX_CART_QUANTITY } from "@/lib/constants";
import { formatCents } from "@/lib/utils";
import { OrderSummary } from "./order-summary";
import { CouponForm, ZipForm } from "./coupon-zip-form";

export function CartView() {
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const couponCode = useCartStore((s) => s.couponCode);
  const confirm = useConfirm();
  const { data: quote, isFetching, isError, refetch } = useCartQuote();

  if (!hydrated) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-7" />}
        title="Seu carrinho está vazio"
        description="Explore o catálogo e adicione produtos para simular uma compra."
        action={<ButtonLink href="/produtos">Explorar produtos</ButtonLink>}
      />
    );
  }

  const lineById = new Map(quote?.lines.map((l) => [l.productId, l]));
  const unavailable = quote?.lines.filter((l) => !l.available) ?? [];
  const adjusted = quote?.lines.filter((l) => l.available && l.quantity < l.requestedQuantity) ?? [];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        {(unavailable.length > 0 || adjusted.length > 0) && (
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
            <TriangleAlert className="size-5 shrink-0" />
            <div>
              {unavailable.length > 0 && <p>Alguns itens estão indisponíveis e não serão incluídos: {unavailable.map((l) => l.name).join(", ")}.</p>}
              {adjusted.length > 0 && <p>Ajustamos a quantidade de itens com estoque limitado.</p>}
            </div>
          </div>
        )}
        {isError && (
          <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Não foi possível atualizar os preços.
            <Button size="sm" variant="outline" onClick={() => refetch()}>Tentar novamente</Button>
          </div>
        )}

        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const line = lineById.get(item.productId);
              const available = line?.available ?? true;
              const unit = line?.unitPriceCents ?? item.unitPriceCents;
              return (
                <motion.li
                  key={item.productId}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40, height: 0, marginTop: 0 }}
                  className={`flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-card ${available ? "" : "opacity-60"}`}
                >
                  <Link href={`/produtos/${item.slug}`} className="shrink-0">
                    <ProductVisual name={item.name} packaging={item.packaging} accentColor={item.accentColor} imageUrl={item.imageUrl} className="size-20 rounded-xl sm:size-24" compact />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary">{item.brand}</p>
                      <Link href={`/produtos/${item.slug}`} className="line-clamp-2 font-semibold text-slate-800 hover:text-primary">{item.name}</Link>
                      <p className="mt-0.5 text-sm text-slate-500">{formatCents(unit)} / un.</p>
                      {!available && <p className="text-xs font-semibold text-red-600">Indisponível</p>}
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <QuantityStepper size="sm" value={item.quantity} max={Math.min(item.stock, MAX_CART_QUANTITY)} onChange={(q) => setQuantity(item.productId, q)} label={`Quantidade de ${item.name}`} />
                      <p className="w-24 text-right font-bold text-slate-900">{formatCents(unit * item.quantity)}</p>
                      <button onClick={() => remove(item.productId)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" aria-label={`Remover ${item.name}`}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/produtos" className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="size-4" /> Continuar comprando
          </Link>
          <button
            onClick={async () => {
              if (await confirm({ title: "Esvaziar carrinho?", description: "Todos os itens serão removidos do carrinho.", confirmLabel: "Esvaziar" })) clear();
            }}
            className="text-sm font-semibold text-slate-500 hover:text-red-600"
          >
            Esvaziar carrinho
          </button>
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-44">
        <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
          <ZipForm />
          <CouponForm coupon={quote?.coupon ?? null} />
        </div>
        {quote ? (
          <OrderSummary totals={quote.totals} freeShippingMinCents={quote.freeShippingMinCents} couponCode={quote.coupon?.valid ? couponCode : null} loading={isFetching}>
            <ButtonLink href="/checkout" size="lg" className={`w-full ${quote.lines.every((l) => !l.available) ? "pointer-events-none opacity-50" : ""}`}>
              <Lock className="size-4" /> Finalizar compra
            </ButtonLink>
          </OrderSummary>
        ) : (
          <Skeleton className="h-72 rounded-3xl" />
        )}
      </div>
    </div>
  );
}
