import { handler, parseBody } from "@/server/http";
import { checkoutSchema } from "@/lib/validators/checkout";
import { createOrder } from "@/server/services/order.service";

export const POST = handler({ auth: "user", rateLimit: "checkout" }, async ({ req, session }) => {
  const order = await createOrder(session!.sub, await parseBody(req, checkoutSchema));
  return { order };
});
