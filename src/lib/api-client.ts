import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export interface ApiErrorBody {
  error: { code: string; message: string; details: { path: string; message: string }[] | null };
}

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 20_000,
});

let refreshing: Promise<void> | null = null;

/**
 * Em 401, tenta renovar a sessão UMA vez (refresh token em cookie httpOnly)
 * e repete a requisição. Requisições simultâneas compartilham a mesma renovação.
 */
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthRoute = original?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && original && !original._retried && !isAuthRoute) {
      original._retried = true;
      try {
        refreshing ??= axios.post("/api/auth/refresh", null, { withCredentials: true }).then(() => undefined);
        await refreshing;
        return api(original);
      } catch {
        /* sessão realmente expirada */
      } finally {
        refreshing = null;
      }
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown, fallback = "Não foi possível concluir a operação."): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return "Sem conexão com o servidor. Verifique sua internet.";
    return error.response.data?.error?.message ?? fallback;
  }
  return fallback;
}

/** Mapeia erros de validação do backend para campos do formulário. */
export function getFieldErrors(error: unknown): { path: string; message: string }[] {
  if (axios.isAxiosError<ApiErrorBody>(error) && Array.isArray(error.response?.data?.error?.details)) {
    return error.response.data.error.details;
  }
  return [];
}
