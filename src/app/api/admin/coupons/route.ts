import { handler, parseBody } from "@/server/http";
import { couponSchema } from "@/lib/validators/admin";
import { createCoupon, listCouponsAdmin } from "@/server/services/coupon.service";

export const GET = handler({ auth: "admin" }, async () => ({ items: await listCouponsAdmin() }));

export const POST = handler({ auth: "admin" }, async ({ req }) => ({
  coupon: await createCoupon(await parseBody(req, couponSchema)),
}));
