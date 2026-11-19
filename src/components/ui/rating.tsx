import { Star } from "lucide-react";

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Avaliação ${value.toFixed(1)} de 5`}>
      <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
      <span className="text-xs font-semibold text-slate-700">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-xs text-slate-400">({count})</span>}
    </div>
  );
}
