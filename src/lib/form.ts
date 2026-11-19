import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { getErrorMessage, getFieldErrors } from "./api-client";

/**
 * Aplica erros de validação do backend nos campos do formulário
 * e exibe um toast com a mensagem geral.
 */
export function handleFormError<T extends FieldValues>(error: unknown, setError?: UseFormSetError<T>) {
  const fields = getFieldErrors(error);
  if (setError) {
    for (const f of fields) if (f.path) setError(f.path as Path<T>, { type: "server", message: f.message });
  }
  toast.error(getErrorMessage(error));
}
