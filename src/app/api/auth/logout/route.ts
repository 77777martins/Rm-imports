import { NextResponse } from "next/server";
import { handler } from "@/server/http";
import { logout } from "@/server/services/auth.service";
import { clearAuthCookies, REFRESH_COOKIE } from "@/server/auth/cookies";

export const POST = handler({}, async ({ req }) => {
  await logout(req.cookies.get(REFRESH_COOKIE)?.value);
  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
});
