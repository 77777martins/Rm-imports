"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api-client";
import type { Totals } from "@/lib/pricing";
import type { PackagingType } from "@/generated/prisma/enums";
import { useCartStore } from "@/stores/cart-store";

export interface QuoteLine {
  productId: string;
  sku: string;
  name: string;
  slug: string;
  brand: string;
  priceCents: number;
  salePriceCents: number | null;
  unitPriceCents: number;
  stock: number;
  imageUrl: string | null;
  packaging: PackagingType;
  accentColor: string;
  quantity: number;
  requestedQuantity: number;
  available: boolean;
  lineTotalCents: number;
}

export interface CartQuote {
  lines: QuoteLine[];
  missing: string[];
  coupon: { code: string; valid: boolean; message: string; type?: string } | null;
  totals: Totals;
  freeShippingMinCents: number;
  maxInstallments: number;
}

/** Orçamento autoritativo do servidor; sincroniza preço/estoque no carrinho local. */
export function useCartQuote(zipOverride?: string | null) {
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const storedZip = useCartStore((s) => s.zipCode);
  const sync = useCartStore((s) => s.syncFromServer);
  const zipCode = zipOverride ?? storedZip;
  const payload = { items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })), couponCode, zipCode };

  const query = useQuery({
    queryKey: ["cart-quote", payload],
    queryFn: async ({ signal }) => (await api.post<CartQuote>("/cart/quote", payload, { signal })).data,
    enabled: items.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (query.data) sync(query.data.lines, query.data.missing);
  }, [query.data, sync]);

  return query;
}
