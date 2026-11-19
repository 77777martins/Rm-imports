import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Crie sua conta"
      subtitle="Leva menos de um minuto."
      footer={<>Já tem conta? <Link href="/entrar" className="font-semibold text-primary hover:underline">Entrar</Link></>}
    >
      <RegisterForm />
    </AuthCard>
  );
}
