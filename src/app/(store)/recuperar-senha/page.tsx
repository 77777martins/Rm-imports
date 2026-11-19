import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/password-recovery-forms";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Recuperar senha" subtitle="Informe seu e-mail para receber um link de redefinição.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
