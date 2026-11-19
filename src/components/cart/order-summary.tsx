"use client";

import { Truck } from "lucide-react";
import type { Totals } from "@/lib/pricing";
import { formatCents } from "@/lib/utils";

interface Props {
  totals: Totals;
  freeShippingMinCents: number;
  couponCode?: string | null;
  children?: React.ReactNode;
  loading?: boolean;
}

export function OrderSummary({ totals, freeShippingMinCents, couponCode, children, loading }: Props) {
  const remaining = Math.max(0, freeShippingMinCents - (totals.subtotalCents - totals.discountCents));
  const progress = Math.min(100, ((totals.subtotalCents - totals.discountCents) / freeShippingMinCents) * 100);
  const row = "flex items-center justify-between text-sm";

  return (
    <div className={`rounded-3xl border border-slate-100 bg-white p-6 shadow-card transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
      <h2 className="mb-4 text-lg font-bold text-slate-900">Resumo do pedido</h2>
      <div className="mb-5 rounded-2xl bg-primary-50 p-3">
        <p className="flex items-center gap-2 text-xs font-medium text-primary-800">
          <Truck className="size-4" />
          {totals.freeShipping ? <strong>Você ganhou frete grátis!</strong> : <>Faltam <strong>{formatCents(remaining)}</strong> para frete grátis</>}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${totals.freeShipping ? 100 : progress}%` }} />
        </div>
      </div>
      <dl className="space-y-3">
        <div className={row}>
          <dt className="text-slate-500">Subtotal</dt>
          <dd className="font-semibold text-slate-800">{formatCents(totals.subtotalCents)}</dd>
        </div>
        {totals.discountCents > 0 && (
          <div className={row}>
            <dt className="text-slate-500">Desconto {couponCode && <span className="font-mono text-xs">({couponCode})</span>}</dt>
            <dd className="font-semibold text-emerald-600">- {formatCents(totals.discountCents)}</dd>
          </div>
        )}
        <div className={row}>
          <dt className="text-slate-500">Frete {totals.shippingZone && <span className="text-xs">· {totals.shippingZone}</span>}</dt>
          <dd className="font-semibold text-slate-800">
            {totals.shippingCents === null ? <span className="text-xs font-normal text-slate-400">Informe o CEP</span> : totals.shippingCents === 0 ? <span className="text-emerald-600">Grátis</span> : formatCents(totals.shippingCents)}
          </dd>
        </div>
        {totals.shippingDays && <p className="text-right text-xs text-slate-400">Entrega simulada em até {totals.shippingDays} dias úteis</p>}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <dt className="font-bold text-slate-900">Total</dt>
          <dd className="text-2xl font-extrabold tracking-tight text-slate-900">{formatCents(totals.totalCents)}</dd>
        </div>
      </dl>
      {children && <div className="mt-6 space-y-3">{children}</div>}
    </div>
  );
}
