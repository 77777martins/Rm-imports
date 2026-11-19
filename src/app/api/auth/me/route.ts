import { handler } from "@/server/http";
import { getProfile } from "@/server/services/user.service";

export const GET = handler({ auth: "user" }, async ({ session }) => ({ user: await getProfile(session!.sub) }));
