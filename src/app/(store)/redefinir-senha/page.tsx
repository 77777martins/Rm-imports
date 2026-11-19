import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/password-recovery-forms";

export const metadata: Metadata = { title: "Redefinir senha", referrer: "no-referrer" };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Defina uma nova senha" subtitle="Por segurança, todas as sessões ativas serão encerradas.">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
