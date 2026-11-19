import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Modo link (páginas server-side) */
  hrefFor?: (page: number) => string;
  /** Modo controlado (componentes client) */
  onPageChange?: (page: number) => void;
}

function pageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export function Pagination({ page, totalPages, hrefFor, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const item = "grid h-10 min-w-10 place-items-center rounded-xl px-3 text-sm font-semibold transition-colors";

  const renderItem = (p: number, label: React.ReactNode, disabled = false, active = false, ariaLabel?: string) => {
    const cls = cn(item, active ? "bg-primary text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-primary hover:text-primary", disabled && "pointer-events-none opacity-40");
    if (hrefFor && disabled)
      return <span key={`${p}-${ariaLabel ?? ""}`} className={cls} aria-hidden>{label}</span>;
    if (hrefFor)
      return <Link key={`${p}-${ariaLabel ?? ""}`} href={hrefFor(p)} className={cls} aria-label={ariaLabel} aria-current={active ? "page" : undefined} scroll>{label}</Link>;
    return (
      <button key={`${p}-${ariaLabel ?? ""}`} type="button" className={cls} disabled={disabled} aria-label={ariaLabel} aria-current={active ? "page" : undefined} onClick={() => onPageChange?.(p)}>
        {label}
      </button>
    );
  };

  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-1.5">
      {renderItem(page - 1, <ChevronLeft className="size-4" />, page <= 1, false, "Página anterior")}
      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? <span key={`e${i}`} className="px-1 text-slate-400">…</span> : renderItem(p, p, false, p === page),
      )}
      {renderItem(page + 1, <ChevronRight className="size-4" />, page >= totalPages, false, "Próxima página")}
    </nav>
  );
}
