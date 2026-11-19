import { handler, parseBody, parseId } from "@/server/http";
import { idSchema } from "@/lib/validators/common";
import { categorySchema } from "@/lib/validators/admin";
import { deleteCategory, updateCategory } from "@/server/services/category.service";

type P = { id: string };

export const PUT = handler<P>({ auth: "admin" }, async ({ req, params }) => ({
  category: await updateCategory(parseId(params.id, idSchema), await parseBody(req, categorySchema)),
}));

export const DELETE = handler<P>({ auth: "admin" }, async ({ params }) => {
  await deleteCategory(parseId(params.id, idSchema));
  return { ok: true };
});
