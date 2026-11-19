import { NextResponse, type NextRequest } from "next/server";
import { verifyAccessToken } from "@/server/auth/tokens";
import { ACCESS_COOKIE } from "@/server/auth/cookies";

const PROTECTED_PREFIXES = ["/conta", "/checkout", "/admin", "/pedido"];
const GUEST_ONLY = ["/entrar", "/cadastro"];
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function allowedOrigins(req: NextRequest): Set<string> {
  const origins = new Set([req.nextUrl.origin]);
  if (process.env.APP_URL) origins.add(new URL(process.env.APP_URL).origin);
  return origins;
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ---- CSRF: requisições mutáveis à API precisam vir da própria origem ----
  if (pathname.startsWith("/api/")) {
    if (!SAFE_METHODS.has(req.method)) {
      const origin = req.headers.get("origin");
      const fetchSite = req.headers.get("sec-fetch-site");
      if ((origin && !allowedOrigins(req).has(origin)) || fetchSite === "cross-site") {
        return NextResponse.json(
          { error: { code: "CSRF_BLOCKED", message: "Origem da requisição não permitida.", details: null } },
          { status: 403 },
        );
      }
    }
    return NextResponse.next();
  }

  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const session = token ? await verifyAccessToken(token) : null;

  if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!session) {
      // Tenta renovar via refresh token (cookie restrito a /api/auth).
      const refreshUrl = new URL("/api/auth/refresh", req.url);
      refreshUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(refreshUrl);
    }
    if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/?acesso=negado", req.url));
    }
  }

  if (session && GUEST_ONLY.includes(pathname)) {
    return NextResponse.redirect(new URL(session.role === "ADMIN" ? "/admin" : "/conta", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
