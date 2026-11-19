"use client";

import { useQuery } from "@tanstack/react-query";
import { LoaderCircle, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { useDebounce } from "@/hooks/use-debounce";
import { cn, formatCents } from "@/lib/utils";
import { ProductVisual } from "@/components/product/product-visual";
import type { PackagingType } from "@/generated/prisma/enums";

interface Suggestion {
  id: string;
  name: string;
  slug: string;
  brand: string;
  finalPriceCents: number;
  packaging: PackagingType;
  accentColor: string;
  imageUrl: string | null;
}

/** Busca com sugestões em tempo real (debounce + cancelamento via React Query). */
export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [term, setTerm] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const debounced = useDebounce(term.trim(), 250);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const { data, isFetching } = useQuery({
    queryKey: ["suggest", debounced],
    queryFn: async ({ signal }) => (await api.get<{ items: Suggestion[] }>("/products/suggest", { params: { q: debounced }, signal })).data.items,
    enabled: debounced.length >= 2,
    staleTime: 60_000,
  });
  const items = debounced.length >= 2 ? (data ?? []) : [];

  useEffect(() => {
    const onClick = (e: MouseEvent) => !boxRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && items[active]) {
      router.push(`/produtos/${items[active].slug}`);
    } else {
      const q = term.trim();
      router.push(q ? `/produtos?q=${encodeURIComponent(q)}` : "/produtos");
    }
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <form role="search" onSubmit={submit} className="relative">
        <input
          type="search"
          value={term}
          maxLength={80}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Busque por produto, marca ou categoria..."
          aria-label="Buscar produtos"
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          className="h-12 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 pl-5 pr-14 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-primary focus:bg-white focus:outline-none"
        />
        <button type="submit" aria-label="Buscar" className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-700">
          {isFetching ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" />}
        </button>
      </form>
      {open && items.length > 0 && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-lift">
          {items.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === active}>
              <Link
                href={`/produtos/${s.slug}`}
                onClick={() => setOpen(false)}
                className={cn("flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-primary-50", i === active && "bg-primary-50")}
              >
                <ProductVisual name={s.name} packaging={s.packaging} accentColor={s.accentColor} imageUrl={s.imageUrl} className="size-12 shrink-0 rounded-lg" compact />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.brand}</p>
                </div>
                <span className="text-sm font-bold text-primary-800">{formatCents(s.finalPriceCents)}</span>
              </Link>
            </li>
          ))}
          <li>
            <button onClick={submit} className="w-full rounded-xl p-2 text-center text-sm font-semibold text-primary hover:bg-primary-50">
              Ver todos os resultados para &quot;{term.trim()}&quot;
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
