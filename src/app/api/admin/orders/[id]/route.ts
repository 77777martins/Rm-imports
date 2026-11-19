import { handler, parseBody, parseId } from "@/server/http";
import { idSchema } from "@/lib/validators/common";
import { orderStatusUpdateSchema } from "@/lib/validators/admin";
import { getOrderAdmin, updateOrderStatusAdmin } from "@/server/services/order.service";

type P = { id: string };

export const GET = handler<P>({ auth: "admin" }, async ({ params }) => ({
  order: await getOrderAdmin(parseId(params.id, idSchema)),
}));

export const PATCH = handler<P>({ auth: "admin" }, async ({ req, params, session }) => {
  const { status, note } = await parseBody(req, orderStatusUpdateSchema);
  return { order: await updateOrderStatusAdmin(session!.sub, parseId(params.id, idSchema), status, note) };
});
