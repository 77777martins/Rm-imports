"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Truck, Zap } from "lucide-react";
import { MAX_CART_QUANTITY } from "@/lib/constants";
import { quoteShipping } from "@/lib/pricing";
import { formatCents } from "@/lib/utils";
import { useCartStore, type CartItem } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { AddToCartButton } from "./add-to-cart-button";
import { QuantityStepper } from "./quantity-stepper";

export function ProductPurchase({ product, freeShippingMinCents }: { product: Omit<CartItem, "quantity">; freeShippingMinCents: number }) {
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const [qty, setQty] = useState(1);
  const max = Math.min(product.stock, MAX_CART_QUANTITY);

  if (product.stock <= 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
        <p className="font-semibold text-slate-800">Produto indisponível no momento</p>
        <p className="mt-1 text-sm text-slate-500">Estoque demonstrativo esgotado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper value={qty} max={max} onChange={(v) => setQty(Math.max(1, Math.min(max, v)))} />
        <AddToCartButton product={product} quantity={qty} size="lg" className="flex-1" label="Adicionar ao carrinho" />
      </div>
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => {
          add(product, qty);
          router.push("/carrinho");
        }}
      >
        <Zap className="size-4" /> Comprar agora
      </Button>
      <ShippingCalculator subtotalCents={product.unitPriceCents * qty} freeShippingMinCents={freeShippingMinCents} />
    </div>
  );
}

function ShippingCalculator({ subtotalCents, freeShippingMinCents }: { subtotalCents: number; freeShippingMinCents: number }) {
  const zip = useCartStore((s) => s.zipCode);
  const setZip = useCartStore((s) => s.setZip);
  const [value, setValue] = useState(zip ?? "");
  const [submitted, setSubmitted] = useState(zip);
  const quote = submitted ? quoteShipping(submitted) : null;
  const free = subtotalCents >= freeShippingMinCents;

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Truck className="size-4 text-primary" /> Calcular frete (simulado)
      </p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(value);
          if (quoteShipping(value)) setZip(value);
        }}
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d-]/g, "").slice(0, 9))}
          placeholder="00000-000"
          inputMode="numeric"
          aria-label="CEP"
          wrapperClassName="flex-1"
        />
        <Button type="submit" variant="outline">Calcular</Button>
      </form>
      {submitted && (
        <p className="mt-2 text-sm" aria-live="polite">
          {quote ? (
            <span className="text-slate-600">
              {quote.zone}: <strong className="text-slate-900">{free ? "Grátis" : formatCents(quote.cents)}</strong> · até {quote.days} dias úteis
            </span>
          ) : (
            <span className="text-red-600">CEP inválido.</span>
          )}
        </p>
      )}
    </div>
  );
}
