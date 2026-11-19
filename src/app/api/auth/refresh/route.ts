import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, handler } from "@/server/http";
import { refresh } from "@/server/services/auth.service";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "@/server/auth/cookies";
import { AppError } from "@/server/errors";
import { safeInternalPath } from "@/lib/utils";

/** POST: usado pelo interceptor do Axios quando a API responde 401. */
export const POST = handler({ rateLimit: "auth" }, async ({ req }) => {
  const raw = req.cookies.get(REFRESH_COOKIE)?.value;
  try {
    if (!raw) throw new AppError("Sessão expirada.", 401, "UNAUTHORIZED");
    const { accessToken, refreshToken } = await refresh(raw, req.headers.get("user-agent"));
    const res = NextResponse.json({ ok: true });
    setAuthCookies(res, accessToken, refreshToken);
    return res;
  } catch (error) {
    const res = errorResponse(error, req);
    clearAuthCookies(res);
    return res;
  }
});

/**
 * GET: usado pelo proxy na navegação de páginas protegidas quando o access
 * token expirou. Renova e redireciona de volta (apenas para caminhos internos).
 */
export async function GET(req: NextRequest) {
  const next = safeInternalPath(req.nextUrl.searchParams.get("next"), "/");
  const raw = req.cookies.get(REFRESH_COOKIE)?.value;
  if (raw) {
    try {
      const { accessToken, refreshToken } = await refresh(raw, req.headers.get("user-agent"));
      const res = NextResponse.redirect(new URL(next, req.url));
      setAuthCookies(res, accessToken, refreshToken);
      return res;
    } catch {
      /* cai no redirecionamento para login */
    }
  }
  const login = new URL("/entrar", req.url);
  login.searchParams.set("next", next);
  const res = NextResponse.redirect(login);
  clearAuthCookies(res);
  return res;
}
