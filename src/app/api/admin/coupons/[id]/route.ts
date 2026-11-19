import { handler, parseBody, parseId } from "@/server/http";
import { idSchema } from "@/lib/validators/common";
import { couponSchema } from "@/lib/validators/admin";
import { deleteCoupon, updateCoupon } from "@/server/services/coupon.service";

type P = { id: string };

export const PUT = handler<P>({ auth: "admin" }, async ({ req, params }) => ({
  coupon: await updateCoupon(parseId(params.id, idSchema), await parseBody(req, couponSchema)),
}));

export const DELETE = handler<P>({ auth: "admin" }, async ({ params }) => {
  await deleteCoupon(parseId(params.id, idSchema));
  return { ok: true };
});
