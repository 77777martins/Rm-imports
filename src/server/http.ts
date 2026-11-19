import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { type z, ZodError, type ZodType } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { AppError, Errors } from "./errors";
import { logger } from "./logger";
import { rateLimit, RATE_LIMITS, type RateLimitPolicy } from "./rate-limit";
import { requireAdmin, requireUser, getSession } from "./auth/session";
import type { AccessPayload } from "./auth/tokens";

const MAX_BODY_BYTES = 100_000;

export function getClientIp(req: NextRequest): string {
  // Em produção atrás de proxy confiável (Vercel/Nginx), o 1º IP do XFF é o cliente.
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim().slice(0, 64);
}

interface HandlerOptions {
  auth?: "optional" | "user" | "admin";
  rateLimit?: RateLimitPolicy;
}

interface HandlerContext<P> {
  req: NextRequest;
  params: P;
  session: AccessPayload | null;
  ip: string;
}

type RouteContext<P> = { params: Promise<P> };

/**
 * Envolve um Route Handler com: rate limit, autenticação/autorização,
 * serialização JSON e tratamento centralizado de erros.
 */
export function handler<P = Record<string, string>>(
  options: HandlerOptions,
  fn: (ctx: HandlerContext<P>) => Promise<unknown>,
) {
  return async (req: NextRequest, routeCtx: RouteContext<P>): Promise<Response> => {
    try {
      const ip = getClientIp(req);
      const policy = options.rateLimit ?? (req.method === "GET" ? "read" : "write");
      const { limit, windowMs } = RATE_LIMITS[policy];
      const rl = rateLimit(`${policy}:${ip}`, limit, windowMs);
      if (!rl.allowed) throw Errors.tooMany(rl.retryAfterSeconds);

      const session =
        options.auth === "admin" ? await requireAdmin() : options.auth === "user" ? await requireUser() : await getSession();

      const params = (routeCtx?.params ? await routeCtx.params : {}) as P;
      const result = await fn({ req, params, session, ip });
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (error) {
      return errorResponse(error, req);
    }
  };
}

export function errorResponse(error: unknown, req?: NextRequest): NextResponse {
  if (error instanceof AppError) {
    const res = NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details ?? null } },
      { status: error.status },
    );
    if (error.status === 429) {
      const retry = (error.details as { retryAfter?: number } | undefined)?.retryAfter;
      if (retry) res.headers.set("Retry-After", String(retry));
    }
    return res;
  }
  if (error instanceof ZodError) return errorResponse(Errors.validation(formatZodIssues(error)), req);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return errorResponse(Errors.conflict("Já existe um registro com estes dados únicos."), req);
    if (error.code === "P2025") return errorResponse(Errors.notFound(), req);
    if (error.code === "P2003") return errorResponse(Errors.conflict("Registro vinculado a outros dados."), req);
  }
  logger.error("Erro não tratado na API", { path: req?.nextUrl.pathname, method: req?.method, error });
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Erro interno. Tente novamente em instantes.", details: null } },
    { status: 500 },
  );
}

export function formatZodIssues(error: ZodError) {
  return error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
}

/** Lê e valida corpo JSON com limite de tamanho. */
export async function parseBody<S extends ZodType>(req: NextRequest, schema: S): Promise<z.output<S>> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) throw Errors.badRequest("Content-Type deve ser application/json.");
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) throw Errors.badRequest("Corpo da requisição muito grande.");
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw Errors.badRequest("JSON inválido.");
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw Errors.validation(formatZodIssues(parsed.error));
  return parsed.data;
}

export function parseQuery<S extends ZodType>(req: NextRequest, schema: S): z.output<S> {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw Errors.validation(formatZodIssues(parsed.error));
  return parsed.data;
}

export function parseId<S extends ZodType>(value: unknown, schema: S): z.output<S> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw Errors.notFound();
  return parsed.data;
}
