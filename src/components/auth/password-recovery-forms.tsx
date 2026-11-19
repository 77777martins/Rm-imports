"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, FlaskConical, Mail } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validators/auth";
import { api } from "@/lib/api-client";
import { handleFormError } from "@/lib/form";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { PasswordInput } from "./password-input";

export function ForgotPasswordForm() {
  const [result, setResult] = useState<{ message: string; demoResetUrl: string | null } | null>(null);
  const { register, handleSubmit, formState, setError } = useForm<z.input<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { data } = await api.post("/auth/forgot-password", values);
      setResult(data);
    } catch (error) {
      handleFormError(error, setError);
    }
  });

  if (result) {
    // Exibe apenas o caminho do link (nunca injeta HTML) — origem é sempre a própria aplicação.
    const demoPath = result.demoResetUrl ? new URL(result.demoResetUrl).pathname + new URL(result.demoResetUrl).search : null;
    return (
      <div className="space-y-4 text-center">
        <CircleCheck className="mx-auto size-12 text-primary" />
        <p className="text-sm text-slate-600">{result.message}</p>
        {demoPath && (
          <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-left">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
              <FlaskConical className="size-3.5" /> E-mail simulado
            </p>
            <p className="mb-3 text-sm text-amber-900">Em produção este link seria enviado por e-mail. Para a demonstração, use o botão abaixo (válido por 30 minutos, uso único).</p>
            <ButtonLink href={demoPath} size="sm" className="w-full">Redefinir minha senha</ButtonLink>
          </div>
        )}
        <Link href="/entrar" className="block text-sm font-semibold text-primary hover:underline">Voltar para o login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Input label="E-mail cadastrado" type="email" autoComplete="email" leftIcon={<Mail className="size-4" />} error={formState.errors.email?.message} {...register("email")} />
      <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>Enviar link de recuperação</Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const { register, handleSubmit, formState, setError } = useForm<z.input<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-slate-600">Link inválido. Solicite uma nova recuperação de senha.</p>
        <ButtonLink href="/recuperar-senha">Recuperar senha</ButtonLink>
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { data } = await api.post<{ message: string }>("/auth/reset-password", values);
      toast.success(data.message);
      router.replace("/entrar");
    } catch (error) {
      handleFormError(error, setError);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="hidden" {...register("token")} />
      <PasswordInput label="Nova senha" autoComplete="new-password" hint="Mínimo de 8 caracteres, com maiúscula, minúscula e número." error={formState.errors.password?.message} {...register("password")} />
      <PasswordInput label="Confirmar nova senha" autoComplete="new-password" error={formState.errors.confirmPassword?.message} {...register("confirmPassword")} />
      <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>Salvar nova senha</Button>
    </form>
  );
}
