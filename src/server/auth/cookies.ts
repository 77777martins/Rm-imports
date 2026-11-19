import "server-only";
import type { NextResponse } from "next/server";
import { env, isProduction } from "../env";

export const ACCESS_COOKIE = "mf_at";
export const REFRESH_COOKIE = "mf_rt";
/** O refresh token só trafega para as rotas de autenticação. */
export const REFRESH_COOKIE_PATH = "/api/auth";

const base = { httpOnly: true, secure: isProduction, sameSite: "lax" as const };

export function setAuthCookies(res: NextResponse, accessToken: string, refreshToken: string) {
  res.cookies.set(ACCESS_COOKIE, accessToken, { ...base, path: "/", maxAge: env.ACCESS_TOKEN_TTL_MINUTES * 60 });
  res.cookies.set(REFRESH_COOKIE, refreshToken, {
    ...base,
    path: REFRESH_COOKIE_PATH,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  });
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { ...base, path: "/", maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...base, path: REFRESH_COOKIE_PATH, maxAge: 0 });
}
