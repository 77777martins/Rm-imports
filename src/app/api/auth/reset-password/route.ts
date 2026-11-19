import { handler, parseBody } from "@/server/http";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { resetPassword } from "@/server/services/auth.service";

export const POST = handler({ rateLimit: "passwordReset" }, async ({ req }) => {
  await resetPassword(await parseBody(req, resetPasswordSchema));
  return { message: "Senha redefinida com sucesso. Faça login com a nova senha." };
});
