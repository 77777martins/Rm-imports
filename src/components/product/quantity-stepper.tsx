"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  max: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
  label?: string;
}

export function QuantityStepper({ value, max, onChange, size = "md", label = "Quantidade" }: Props) {
  const btn = cn("grid place-items-center text-slate-600 transition-colors hover:bg-slate-100 hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent", size === "sm" ? "size-8" : "size-11");
  return (
    <div className={cn("inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white", size === "sm" ? "h-8" : "h-11")} role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Diminuir quantidade">
        <Minus className="size-4" />
      </button>
      <span className={cn("text-center font-bold tabular-nums text-slate-900", size === "sm" ? "w-8 text-sm" : "w-10")} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Aumentar quantidade">
        <Plus className="size-4" />
      </button>
    </div>
  );
}
