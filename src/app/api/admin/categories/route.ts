import { handler, parseBody } from "@/server/http";
import { categorySchema } from "@/lib/validators/admin";
import { createCategory, listCategoriesAdmin } from "@/server/services/category.service";

export const GET = handler({ auth: "admin" }, async () => ({ items: await listCategoriesAdmin() }));

export const POST = handler({ auth: "admin" }, async ({ req }) => ({
  category: await createCategory(await parseBody(req, categorySchema)),
}));
