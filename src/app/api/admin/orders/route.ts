import { z } from "zod";
import { handler, parseQuery } from "@/server/http";
import { paginationSchema } from "@/lib/validators/common";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import type { OrderStatus } from "@/generated/prisma/enums";
import { listOrdersAdmin } from "@/server/services/order.service";

const statuses = Object.keys(ORDER_STATUS_LABEL) as [OrderStatus, ...OrderStatus[]];
const querySchema = paginationSchema.extend({
  q: z.string().trim().max(80).optional(),
  status: z.enum(statuses).optional().catch(undefined),
});

export const GET = handler({ auth: "admin" }, async ({ req }) => listOrdersAdmin(parseQuery(req, querySchema)));
