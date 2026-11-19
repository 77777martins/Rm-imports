import { handler, parseBody } from "@/server/http";
import { bannerSchema } from "@/lib/validators/admin";
import { createBanner, listBannersAdmin } from "@/server/services/settings.service";

export const GET = handler({ auth: "admin" }, async () => ({ items: await listBannersAdmin() }));

export const POST = handler({ auth: "admin" }, async ({ req }) => ({
  banner: await createBanner(await parseBody(req, bannerSchema)),
}));
