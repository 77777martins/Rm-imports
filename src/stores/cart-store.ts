"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PackagingType } from "@/generated/prisma/enums";
import { MAX_CART_QUANTITY } from "@/lib/constants";

/**
 * O carrinho guarda dados de exibição em cache, mas o PREÇO e o ESTOQUE
 * reais são sempre recalculados pelo servidor (/api/cart/quote e checkout).
 */
export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  unitPriceCents: number;
  packaging: PackagingType;
  accentColor: string;
  imageUrl: string | null;
  stock: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  zipCode: string | null;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => number;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  setCoupon: (code: string | null) => void;
  setZip: (zip: string | null) => void;
  /** Sincroniza preço/estoque após resposta autoritativa do servidor. */
  syncFromServer: (lines: { productId: string; unitPriceCents: number; stock: number; quantity: number; available: boolean }[], missing: string[]) => void;
}

const clamp = (qty: number, stock: number) => Math.max(1, Math.min(qty, MAX_CART_QUANTITY, Math.max(stock, 1)));

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      zipCode: null,
      add: (item, quantity = 1) => {
        const existing = get().items.find((i) => i.productId === item.productId);
        const nextQty = clamp((existing?.quantity ?? 0) + quantity, item.stock);
        set({
          items: existing
            ? get().items.map((i) => (i.productId === item.productId ? { ...i, ...item, quantity: nextQty } : i))
            : [...get().items, { ...item, quantity: nextQty }],
        });
        return nextQty;
      },
      setQuantity: (productId, quantity) =>
        set({ items: get().items.map((i) => (i.productId === productId ? { ...i, quantity: clamp(quantity, i.stock) } : i)) }),
      remove: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
      clear: () => set({ items: [], couponCode: null }),
      setCoupon: (couponCode) => set({ couponCode }),
      setZip: (zipCode) => set({ zipCode }),
      syncFromServer: (lines, missing) => {
        const byId = new Map(lines.map((l) => [l.productId, l]));
        const items = get()
          .items.filter((i) => !missing.includes(i.productId))
          .map((i) => {
            const l = byId.get(i.productId);
            if (!l) return i;
            const changed = l.unitPriceCents !== i.unitPriceCents || l.stock !== i.stock || (l.available && l.quantity !== i.quantity);
            return changed ? { ...i, unitPriceCents: l.unitPriceCents, stock: l.stock, quantity: l.available ? l.quantity : i.quantity } : i;
          });
        const changed = items.length !== get().items.length || items.some((it, idx) => it !== get().items[idx]);
        if (changed) set({ items });
      },
    }),
    {
      name: "medfacil-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, couponCode: s.couponCode, zipCode: s.zipCode }),
    },
  ),
);

export const selectCartCount = (s: CartState) => s.items.reduce((sum, i) => sum + i.quantity, 0);
