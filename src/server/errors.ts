/** Erros de domínio com status HTTP — mensagens seguras para exibir ao usuário. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = "BAD_REQUEST",
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  badRequest: (msg = "Requisição inválida.", details?: unknown) => new AppError(msg, 400, "BAD_REQUEST", details),
  validation: (details: unknown) => new AppError("Verifique os campos informados.", 422, "VALIDATION_ERROR", details),
  unauthorized: (msg = "Faça login para continuar.") => new AppError(msg, 401, "UNAUTHORIZED"),
  forbidden: (msg = "Você não tem permissão para esta ação.") => new AppError(msg, 403, "FORBIDDEN"),
  notFound: (msg = "Recurso não encontrado.") => new AppError(msg, 404, "NOT_FOUND"),
  conflict: (msg: string) => new AppError(msg, 409, "CONFLICT"),
  paymentDeclined: (msg = "Pagamento recusado pela operadora (simulação).") => new AppError(msg, 402, "PAYMENT_DECLINED"),
  tooMany: (retryAfter: number) =>
    new AppError("Muitas tentativas. Aguarde alguns instantes e tente novamente.", 429, "RATE_LIMITED", { retryAfter }),
};
