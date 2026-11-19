import { z } from "zod";
import { handler, parseQuery } from "@/server/http";
import { suggestProducts } from "@/server/services/product.service";

const schema = z.object({ q: z.string().trim().min(2).max(80) });

export const GET = handler({}, async ({ req }) => ({ items: await suggestProducts(parseQuery(req, schema).q) }));
