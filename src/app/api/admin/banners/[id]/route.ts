import { handler, parseBody, parseId } from "@/server/http";
import { idSchema } from "@/lib/validators/common";
import { bannerSchema } from "@/lib/validators/admin";
import { deleteBanner, updateBanner } from "@/server/services/settings.service";

type P = { id: string };

export const PUT = handler<P>({ auth: "admin" }, async ({ req, params }) => ({
  banner: await updateBanner(parseId(params.id, idSchema), await parseBody(req, bannerSchema)),
}));

export const DELETE = handler<P>({ auth: "admin" }, async ({ params }) => {
  await deleteBanner(parseId(params.id, idSchema));
  return { ok: true };
});
