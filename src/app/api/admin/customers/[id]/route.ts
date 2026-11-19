import { handler, parseId } from "@/server/http";
import { idSchema } from "@/lib/validators/common";
import { getCustomer } from "@/server/services/user.service";

export const GET = handler<{ id: string }>({ auth: "admin" }, async ({ params }) => ({
  customer: await getCustomer(parseId(params.id, idSchema)),
}));
