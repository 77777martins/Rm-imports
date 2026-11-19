import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Entre na sua conta"
      subtitle="Acompanhe pedidos e finalize compras demonstrativas."
      footer={<>Ainda não tem conta? <Link href="/cadastro" className="font-semibold text-primary hover:underline">Cadastre-se</Link></>}
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
