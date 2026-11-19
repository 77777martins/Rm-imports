import "server-only";
import { prisma } from "../db";
import { env } from "../env";
import { Errors } from "../errors";
import { logger } from "../logger";
import { fakeVerify, hashPassword, verifyPassword } from "../auth/password";
import { generateOpaqueToken, hashToken, signAccessToken } from "../auth/tokens";
import type { z } from "zod";
import type { registerSchema, loginSchema, resetPasswordSchema, changePasswordSchema } from "@/lib/validators/auth";

const RESET_TOKEN_TTL_MS = 30 * 60_000;

type UserForToken = { id: string; role: "ADMIN" | "CUSTOMER"; name: string; email: string };

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  zipCode: true,
  street: true,
  number: true,
  complement: true,
  district: true,
  city: true,
  state: true,
  createdAt: true,
} as const;

async function issueTokens(user: UserForToken, userAgent?: string | null) {
  const accessToken = await signAccessToken({ sub: user.id, role: user.role, name: user.name, email: user.email });
  const refreshToken = generateOpaqueToken();
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      userAgent: userAgent?.slice(0, 255) ?? null,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000),
    },
  });
  return { accessToken, refreshToken };
}

export async function register(input: z.output<typeof registerSchema>, userAgent?: string | null) {
  const exists = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (exists) throw Errors.conflict("Já existe uma conta com este e-mail.");
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, phone: input.phone ?? null, passwordHash: await hashPassword(input.password) },
    select: publicUserSelect,
  });
  return { user, ...(await issueTokens(user, userAgent)) };
}

export async function login(input: z.output<typeof loginSchema>, userAgent?: string | null) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...publicUserSelect, passwordHash: true },
  });
  // Mesma mensagem e tempo de resposta para usuário inexistente ou senha errada.
  const valid = user ? await verifyPassword(input.password, user.passwordHash) : await fakeVerify();
  if (!user || !valid) throw Errors.unauthorized("E-mail ou senha incorretos.");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safeUser } = user;
  return { user: safeUser, ...(await issueTokens(safeUser, userAgent)) };
}

/**
 * Rotação de refresh token. Se um token já revogado for reapresentado
 * (possível roubo), todas as sessões do usuário são revogadas.
 */
export async function refresh(rawToken: string, userAgent?: string | null) {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: { select: { id: true, role: true, name: true, email: true } } },
  });
  if (!stored) throw Errors.unauthorized("Sessão expirada.");
  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({ where: { userId: stored.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    logger.warn("Reuso de refresh token detectado — sessões revogadas", { userId: stored.userId });
    throw Errors.unauthorized("Sessão inválida. Faça login novamente.");
  }
  if (stored.expiresAt.getTime() < Date.now()) throw Errors.unauthorized("Sessão expirada.");

  const tokens = await issueTokens(stored.user, userAgent);
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date(), replacedBy: hashToken(tokens.refreshToken) },
  });
  return tokens;
}

export async function logout(rawToken: string | undefined) {
  if (!rawToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Recuperação de senha SIMULADA: gera token de uso único (30 min).
 * Sempre responde da mesma forma para não revelar se o e-mail existe.
 * Em modo demonstração, devolve o link para exibição (no lugar do e-mail).
 */
export async function requestPasswordReset(email: string): Promise<{ demoResetUrl: string | null }> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    await fakeVerify();
    return { demoResetUrl: null };
  }
  const token = generateOpaqueToken();
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    }),
  ]);
  const url = `${env.APP_URL}/redefinir-senha?token=${token}`;
  logger.info("Link de redefinição gerado (e-mail simulado)", { userId: user.id });
  return { demoResetUrl: env.DEMO_SHOW_RESET_LINK ? url : null };
}

export async function resetPassword(input: z.output<typeof resetPasswordSchema>) {
  const stored = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(input.token) } });
  if (!stored || stored.usedAt || stored.expiresAt.getTime() < Date.now())
    throw Errors.badRequest("Link inválido ou expirado. Solicite uma nova recuperação.");
  await prisma.$transaction([
    prisma.user.update({ where: { id: stored.userId }, data: { passwordHash: await hashPassword(input.password) } }),
    prisma.passwordResetToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } }),
    // Encerra todas as sessões ativas após troca de senha.
    prisma.refreshToken.updateMany({ where: { userId: stored.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
}

export async function changePassword(userId: string, input: z.output<typeof changePasswordSchema>) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user) throw Errors.unauthorized();
  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) throw Errors.badRequest("Senha atual incorreta.");
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(input.newPassword) } });
}
