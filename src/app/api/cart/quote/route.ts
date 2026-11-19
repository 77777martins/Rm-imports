import { handler, parseBody } from "@/server/http";
import { cartQuoteSchema } from "@/lib/validators/checkout";
import { quoteCart } from "@/server/services/order.service";

export const POST = handler({ rateLimit: "read" }, async ({ req }) => quoteCart(await parseBody(req, cartQuoteSchema)));
