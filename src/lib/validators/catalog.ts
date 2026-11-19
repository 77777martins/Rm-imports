import { z } from "zod";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/constants";

const sortKeys = Object.keys(PRODUCT_SORTS) as [ProductSort, ...ProductSort[]];

/** Filtros do catálogo — inválidos caem para o padrão (nunca quebram a página). */
export const catalogQuerySchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  categoria: z.string().trim().max(90).regex(/^[a-z0-9-]*$/).optional().catch(undefined),
  ordem: z.enum(sortKeys).catch("relevance").default("relevance"),
  pagina: z.coerce.number().int().min(1).max(1000).catch(1).default(1),
  min: z.coerce.number().min(0).max(100_000).optional().catch(undefined),
  max: z.coerce.number().min(0).max(100_000).optional().catch(undefined),
  promo: z.enum(["1"]).optional().catch(undefined),
  estoque: z.enum(["1"]).optional().catch(undefined),
});
export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
