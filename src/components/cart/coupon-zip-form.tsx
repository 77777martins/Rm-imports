"use client";

import { useState } from "react";
import { MapPin, Ticket, X } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import type { CartQuote } from "@/hooks/use-cart-quote";
import { isValidZip } from "@/lib/pricing";

export function CouponForm({ coupon }: { coupon: CartQuote["coupon"] }) {
  const code = useCartStore((s) => s.couponCode);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const [value, setValue] = useState(code ?? "");

  if (code && coupon?.valid) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <Ticket className="size-4 text-emerald-600" />
          <span><strong className="font-mono">{code}</strong> <span className="text-emerald-700">· {coupon.message}</span></span>
        </div>
        <button onClick={() => { setCoupon(null); setValue(""); }} aria-label="Remover cupom" className="rounded p-1 text-emerald-700 hover:bg-emerald-100">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setCoupon(value.trim().toUpperCase() || null);
      }}
    >
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 30))}
          placeholder="Cupom de desconto"
          aria-label="Cupom de desconto"
          leftIcon={<Ticket className="size-4" />}
          wrapperClassName="flex-1"
          error={code && coupon && !coupon.valid ? coupon.message : undefined}
        />
        <Button type="submit" variant="outline">Aplicar</Button>
      </div>
      <p className="mt-1.5 text-xs text-slate-400">Experimente: BEMVINDO10, MENOS20 ou FRETEGRATIS</p>
    </form>
  );
}

export function ZipForm() {
  const zip = useCartStore((s) => s.zipCode);
  const setZip = useCartStore((s) => s.setZip);
  const [value, setValue] = useState(zip ?? "");
  const [error, setError] = useState<string>();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValidZip(value)) return setError("CEP inválido.");
        setError(undefined);
        setZip(value);
      }}
      className="flex gap-2"
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^\d-]/g, "").slice(0, 9))}
        placeholder="CEP para frete"
        inputMode="numeric"
        aria-label="CEP"
        leftIcon={<MapPin className="size-4" />}
        wrapperClassName="flex-1"
        error={error}
      />
      <Button type="submit" variant="outline">Calcular</Button>
    </form>
  );
}
