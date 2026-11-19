"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  productsCount: number;
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => (await api.get<{ items: AdminCategory[] }>("/admin/categories")).data.items,
  });
}
