import { handler, parseId } from "@/server/http";
import { simulatePixPayment } from "@/server/services/order.service";
import { orderNumberSchema } from "@/lib/validators/checkout";

/** Simula a confirmação do PIX pelo "banco" (demonstração). */
export const POST = handler<{ number: string }>({ auth: "user", rateLimit: "checkout" }, async ({ params, session }) => ({
  order: await simulatePixPayment(session!.sub, parseId(params.number, orderNumberSchema)),
}));
