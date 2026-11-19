import { NextResponse } from "next/server";
import { handler, parseBody } from "@/server/http";
import { loginSchema } from "@/lib/validators/auth";
import { login } from "@/server/services/auth.service";
import { setAuthCookies } from "@/server/auth/cookies";

export const POST = handler({ rateLimit: "auth" }, async ({ req }) => {
  const input = await parseBody(req, loginSchema);
  const { user, accessToken, refreshToken } = await login(input, req.headers.get("user-agent"));
  const res = NextResponse.json({ user });
  setAuthCookies(res, accessToken, refreshToken);
  return res;
});
