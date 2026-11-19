import "server-only";

const SENSITIVE = /pass(word)?|token|secret|authorization|cookie|card|cvv|hash/i;

/** Remove recursivamente campos sensíveis antes de logar. */
function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== "object") return value;
  if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, SENSITIVE.test(k) ? "[REDACTED]" : redact(v, depth + 1)]),
  );
}

function write(level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>) {
  const entry = JSON.stringify({ level, time: new Date().toISOString(), message, ...(meta ? (redact(meta) as object) : {}) });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.info(entry);
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => write("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => write("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => write("error", msg, meta),
};
