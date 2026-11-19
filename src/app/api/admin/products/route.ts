import { z } from "zod";
import { handler, parseBody, parseQuery } from "@/server/http";
import { paginationSchema, idSchema } from "@/lib/validators/common";
import { productSchema } from "@/lib/validators/admin";
import { createProduct, listProductsAdmin } from "@/server/services/product.service";

const querySchema = paginationSchema.extend({
  q: z.string().trim().max(80).optional(),
  categoryId: idSchema.optional().catch(undefined),
  status: z.enum(["active", "inactive", "low-stock", "out-of-stock"]).optional().catch(undefined),
});

export const GET = handler({ auth: "admin" }, async ({ req }) => listProductsAdmin(parseQuery(req, querySchema)));

export const POST = handler({ auth: "admin" }, async ({ req }) => ({
  product: await createProduct(await parseBody(req, productSchema)),
}));
