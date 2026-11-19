import { cn, discountPercent, formatCents } from "@/lib/utils";
import { maxInstallmentsFor } from "@/lib/pricing";
import { MAX_INSTALLMENTS } from "@/lib/constants";

interface PriceProps {
  priceCents: number;
  salePriceCents: number | null;
  size?: "sm" | "lg";
  showInstallments?: boolean;
}

export function Price({ priceCents, salePriceCents, size = "sm", showInstallments = true }: PriceProps) {
  const onSale = !!salePriceCents && salePriceCents < priceCents;
  const final = onSale ? salePriceCents! : priceCents;
  const installments = maxInstallmentsFor(final, MAX_INSTALLMENTS);
  return (
    <div className="flex flex-col">
      {onSale && (
        <span className={cn("text-slate-400 line-through", size === "lg" ? "text-sm" : "text-xs")}>{formatCents(priceCents)}</span>
      )}
      <div className="flex items-baseline gap-2">
        <span className={cn("font-extrabold tracking-tight text-slate-900", size === "lg" ? "text-3xl" : "text-lg")}>{formatCents(final)}</span>
        {onSale && size === "lg" && (
          <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-600">-{discountPercent(priceCents, salePriceCents)}%</span>
        )}
      </div>
      {showInstallments && installments > 1 && (
        <span className={cn("text-slate-500", size === "lg" ? "text-sm" : "text-xs")}>
          ou {installments}x de {formatCents(Math.floor(final / installments))} sem juros
        </span>
      )}
    </div>
  );
}
