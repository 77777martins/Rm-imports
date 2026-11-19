import { handler, parseBody } from "@/server/http";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { requestPasswordReset } from "@/server/services/auth.service";

export const POST = handler({ rateLimit: "passwordReset" }, async ({ req }) => {
  const { email } = await parseBody(req, forgotPasswordSchema);
  const { demoResetUrl } = await requestPasswordReset(email);
  return {
    message: "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.",
    demoResetUrl,
  };
});
