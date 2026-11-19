import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "../db";
import { Errors } from "../errors";
import { ACCESS_COOKIE } from "./cookies";
import { verifyAccessToken, type AccessPayload } from "./tokens";

/** Sessão a partir do cookie de acesso (memoizada por requisição). */
export const getSession = cache(async (): Promise<AccessPayload | null> => {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  return token ? verifyAccessToken(token) : null;
});

export async function requireUser(): Promise<AccessPayload> {
  const session = await getSession();
  if (!session) throw Errors.unauthorized();
  return session;
}

/**
 * Exige administrador. O papel é revalidado no banco (não confia apenas
 * no JWT), garantindo que um rebaixamento de permissão tenha efeito imediato.
 */
export async function requireAdmin(): Promise<AccessPayload> {
  const session = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: session.sub }, select: { role: true } });
  if (!user || user.role !== "ADMIN") throw Errors.forbidden();
  return session;
}
