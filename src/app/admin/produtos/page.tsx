import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsTable } from "@/components/admin/products-table";

export const metadata: Metadata = { title: "Produtos" };

export default function AdminProductsPage() {
  return (
    <Suspense>
      <ProductsTable />
    </Suspense>
  );
}
