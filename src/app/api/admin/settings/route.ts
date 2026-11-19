import { handler, parseBody } from "@/server/http";
import { settingsSchema } from "@/lib/validators/admin";
import { getSettings, updateSettings } from "@/server/services/settings.service";

export const GET = handler({ auth: "admin" }, async () => ({ settings: await getSettings() }));

export const PUT = handler({ auth: "admin" }, async ({ req }) => ({
  settings: await updateSettings(await parseBody(req, settingsSchema)),
}));
