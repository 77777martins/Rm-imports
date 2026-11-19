"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { ProductForm, type ProductFormDefaults } from "@/components/admin/product-form";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: async () => (await api.get<{ product: ProductFormDefaults & { technicalInfo: unknown } }>(`/admin/products/${id}`)).data.product,
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-12 w-72" /><Skeleton className="h-[520px] rounded-2xl" /></div>;
  if (isError || !data)
    return <EmptyState title="Produto não encontrado" action={<ButtonLink href="/admin/produtos">Voltar</ButtonLink>} />;

  const { id: pid, name, sku, brand, description, categoryId, priceCents, salePriceCents, stock, imageUrl, packaging, accentColor, isActive, isFeatured } = data;
  const technicalInfo = Array.isArray(data.technicalInfo) ? (data.technicalInfo as { label: string; value: string }[]) : [];
  return (
    <ProductForm
      initial={{ id: pid, name, sku, brand, description, categoryId, priceCents, salePriceCents, stock, imageUrl: imageUrl ?? "", packaging, accentColor, isActive, isFeatured, technicalInfo }}
    />
  );
}
