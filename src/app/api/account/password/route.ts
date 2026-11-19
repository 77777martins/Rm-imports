import { handler, parseBody } from "@/server/http";
import { changePasswordSchema } from "@/lib/validators/auth";
import { changePassword } from "@/server/services/auth.service";

export const PATCH = handler({ auth: "user", rateLimit: "auth" }, async ({ req, session }) => {
  await changePassword(session!.sub, await parseBody(req, changePasswordSchema));
  return { message: "Senha alterada com sucesso." };
});
