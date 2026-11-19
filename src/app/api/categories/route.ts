import { handler } from "@/server/http";
import { listActiveCategories } from "@/server/services/category.service";

export const GET = handler({}, async () => ({ items: await listActiveCategories() }));
