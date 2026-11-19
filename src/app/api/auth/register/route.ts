import { NextResponse } from "next/server";
import { handler, parseBody } from "@/server/http";
import { registerSchema } from "@/lib/validators/auth";
import { register } from "@/server/services/auth.service";
import { setAuthCookies } from "@/server/auth/cookies";

export const POST = handler({ rateLimit: "auth" }, async ({ req }) => {
  const input = await parseBody(req, registerSchema);
  const { user, accessToken, refreshToken } = await register(input, req.headers.get("user-agent"));
  const res = NextResponse.json({ user }, { status: 201 });
  setAuthCookies(res, accessToken, refreshToken);
  return res;
});
