import { ProductCardSkeleton } from "@/components/product/product-card";
import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="container-page py-8" aria-busy="true" aria-label="Carregando produtos">
      <Skeleton className="mb-3 h-3 w-40" />
      <Skeleton className="mb-8 h-9 w-72" />
      <div className="flex gap-8">
        <Skeleton className="hidden h-[520px] w-64 shrink-0 rounded-2xl lg:block" />
        <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
