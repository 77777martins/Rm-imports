import { handler, parseQuery } from "@/server/http";
import { paginationSchema } from "@/lib/validators/common";
import { listMyOrders } from "@/server/services/order.service";

export const GET = handler({ auth: "user" }, async ({ req, session }) => {
  const { page, pageSize } = parseQuery(req, paginationSchema);
  return listMyOrders(session!.sub, page, Math.min(pageSize, 20));
});
