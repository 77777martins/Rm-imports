import { handler, parseBody, parseId } from "@/server/http";
import { idSchema } from "@/lib/validators/common";
import { productQuickUpdateSchema, productSchema } from "@/lib/validators/admin";
import { deleteProduct, getProductAdmin, quickUpdateProduct, updateProduct } from "@/server/services/product.service";

type P = { id: string };

export const GET = handler<P>({ auth: "admin" }, async ({ params }) => ({
  product: await getProductAdmin(parseId(params.id, idSchema)),
}));

export const PUT = handler<P>({ auth: "admin" }, async ({ req, params }) => ({
  product: await updateProduct(parseId(params.id, idSchema), await parseBody(req, productSchema)),
}));

/** Atualização rápida de preço, estoque e ativação. */
export const PATCH = handler<P>({ auth: "admin" }, async ({ req, params }) => ({
  product: await quickUpdateProduct(parseId(params.id, idSchema), await parseBody(req, productQuickUpdateSchema)),
}));

export const DELETE = handler<P>({ auth: "admin" }, async ({ params }) => {
  await deleteProduct(parseId(params.id, idSchema));
  return { ok: true };
});
