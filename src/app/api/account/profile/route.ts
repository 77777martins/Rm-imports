import { handler, parseBody } from "@/server/http";
import { profileSchema } from "@/lib/validators/account";
import { getProfile, updateProfile } from "@/server/services/user.service";

export const GET = handler({ auth: "user" }, async ({ session }) => ({ user: await getProfile(session!.sub) }));

export const PATCH = handler({ auth: "user" }, async ({ req, session }) => ({
  user: await updateProfile(session!.sub, await parseBody(req, profileSchema)),
}));
