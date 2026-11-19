"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { registerSchema } from "@/lib/validators/auth";
import { api } from "@/lib/api-client";
import { handleFormError } from "@/lib/form";
import { Button } from "@/components/ui/button";
import { Checkbox, Input } from "@/components/ui/field";
import { PasswordInput } from "./password-input";

type Values = z.input<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { register, handleSubmit, formState, setError } = useForm<Values>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });
  const e = formState.errors;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.post("/auth/register", values);
      toast.success("Conta criada com sucesso!");
      router.replace("/conta");
      router.refresh();
    } catch (error) {
      handleFormError(error, setError);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Input label="Nome completo" autoComplete="name" leftIcon={<UserRound className="size-4" />} error={e.name?.message} required {...register("name")} />
      <Input label="E-mail" type="email" autoComplete="email" leftIcon={<Mail className="size-4" />} error={e.email?.message} required {...register("email")} />
      <Input label="Celular (opcional)" type="tel" autoComplete="tel" placeholder="(11) 91234-5678" leftIcon={<Phone className="size-4" />} error={e.phone?.message} {...register("phone")} />
      <PasswordInput label="Senha" autoComplete="new-password" hint="Mínimo de 8 caracteres, com maiúscula, minúscula e número." error={e.password?.message} required {...register("password")} />
      <PasswordInput label="Confirmar senha" autoComplete="new-password" error={e.confirmPassword?.message} required {...register("confirmPassword")} />
      <Checkbox
        label="Entendo que esta é uma loja fictícia de portfólio e que nenhum produto será vendido ou entregue."
        error={e.acceptTerms?.message}
        {...register("acceptTerms")}
      />
      <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>Criar conta</Button>
    </form>
  );
}
