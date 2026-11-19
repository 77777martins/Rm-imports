"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, UserRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { loginSchema } from "@/lib/validators/auth";
import { api } from "@/lib/api-client";
import { handleFormError } from "@/lib/form";
import { safeInternalPath } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { PasswordInput } from "./password-input";

type Input_ = z.input<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeInternalPath(params.get("next"), "");
  const form = useForm<Input_>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const { register, handleSubmit, formState, setValue, setError } = form;

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { data } = await api.post<{ user: { name: string; role: string } }>("/auth/login", values);
      toast.success(`Bem-vindo(a), ${data.user.name.split(" ")[0]}!`);
      router.replace(next || (data.user.role === "ADMIN" ? "/admin" : "/conta"));
      router.refresh();
    } catch (error) {
      handleFormError(error, setError);
    }
  });

  const fillDemo = (email: string, password: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", password, { shouldValidate: true });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Input label="E-mail" type="email" autoComplete="email" leftIcon={<Mail className="size-4" />} error={formState.errors.email?.message} {...register("email")} />
      <PasswordInput label="Senha" autoComplete="current-password" error={formState.errors.password?.message} {...register("password")} />
      <div className="flex justify-end">
        <Link href="/recuperar-senha" className="text-sm font-semibold text-primary hover:underline">Esqueci minha senha</Link>
      </div>
      <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>Entrar</Button>

      <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50/60 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-primary-800">Contas de demonstração</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => fillDemo("cliente@medfacil.demo", "Cliente@123")}>
            <UserRound className="size-4" /> Cliente
          </Button>
          <Button variant="outline" size="sm" onClick={() => fillDemo("admin@medfacil.demo", "Admin@12345")}>
            <ShieldCheck className="size-4" /> Admin
          </Button>
        </div>
      </div>
    </form>
  );
}
