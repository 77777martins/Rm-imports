import { handler, parseId } from "@/server/http";
import { orderNumberSchema } from "@/lib/validators/checkout";
import { getMyOrder } from "@/server/services/order.service";

export const GET = handler<{ number: string }>({ auth: "user" }, async ({ params, session }) => ({
  order: await getMyOrder(session!.sub, parseId(params.number, orderNumberSchema)),
}));
