import "server-only";

/**
 * Rate limiter em memória (janela fixa).
 * Adequado para instância única / demonstração. Em produção com várias
 * instâncias, substitua o Map por Redis (INCR + EXPIRE) mantendo a interface.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of store) if (bucket.resetAt <= now) store.delete(key);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  const allowed = bucket.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: allowed ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/**
 * Multiplicador opcional dos limites (ex.: testes automatizados).
 * Padrão 1 = limites estritos. Nunca aumente em produção sem necessidade.
 */
const multiplier = Math.max(1, Number(process.env.RATE_LIMIT_MULTIPLIER) || 1);

/** Políticas nomeadas, centralizadas para fácil ajuste. */
export const RATE_LIMITS = {
  auth: { limit: 10 * multiplier, windowMs: 15 * 60_000 },
  passwordReset: { limit: 5 * multiplier, windowMs: 15 * 60_000 },
  checkout: { limit: 20 * multiplier, windowMs: 10 * 60_000 },
  write: { limit: 120 * multiplier, windowMs: 60_000 },
  read: { limit: 300 * multiplier, windowMs: 60_000 },
} as const;
export type RateLimitPolicy = keyof typeof RATE_LIMITS;
