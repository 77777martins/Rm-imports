import { handler, parseQuery } from "@/server/http";
import { catalogQuerySchema } from "@/lib/validators/catalog";
import { searchCatalog } from "@/server/services/product.service";

export const GET = handler({}, async ({ req }) => searchCatalog(parseQuery(req, catalogQuerySchema)));
