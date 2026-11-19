"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { selectCartCount, useCartStore } from "@/stores/cart-store";
import { useHydrated } from "@/hooks/use-hydrated";

export function CartButton() {
  const hydrated = useHydrated();
  const count = useCartStore(selectCartCount);
  const shown = hydrated ? count : 0;
  return (
    <Link
      href="/carrinho"
      className="relative flex items-center gap-2 rounded-xl px-2.5 py-2 text-slate-700 transition-colors hover:bg-primary-50 hover:text-primary"
      aria-label={`Carrinho com ${shown} ${shown === 1 ? "item" : "itens"}`}
    >
      <ShoppingCart className="size-6" />
      <span className="hidden text-sm font-semibold lg:inline">Carrinho</span>
      <AnimatePresence>
        {shown > 0 && (
          <motion.span
            key={shown}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-0.5 left-6 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-white"
          >
            {shown > 99 ? "99+" : shown}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
